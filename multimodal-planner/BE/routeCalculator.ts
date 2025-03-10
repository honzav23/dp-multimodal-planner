import { getRouteByCar, getRouteByPublicTransport, calculateDistance, addMinutes } from "./common/common.ts";
import { getRepresentativeTransferStops } from "./cluster.ts";

import type { TripRequest } from "./types/TripRequest.ts";
import type { TripResult, TripResponse } from "../types/TripResult.ts";
import type { TransferStopWithDistance } from "./types/TransferStopWithDistance.ts";
import { transferStops, availableTripsForEachLine } from "./api.ts";
import type { OTPGraphQLData, OTPTripPattern } from "./types/OTPGraphQLData.ts";
import { findBestTrips } from "./transferStopSelector.ts";
import {TransferStop} from "../types/TransferStop.ts";
import polyline from 'polyline'


/**
 * Retrieves the candidate transfer stops for a trip request that are too far from the destination.
 * @param tripRequest The trip request
 * @returns Candidate transfer stops
 */
function getCandidateTransferStops(tripRequest: TripRequest): TransferStopWithDistance[] {

    const transferPointsWithDistance: TransferStopWithDistance[] = transferStops.map((row) => {
        return {
            ...row,
            distanceFromOrigin: calculateDistance(tripRequest.origin[0], tripRequest.origin[1], row.stopCoords[0], row.stopCoords[1]) / 1000,
        }
    });
    const distanceFromOriginToDestination = calculateDistance(tripRequest.origin[0], tripRequest.origin[1], tripRequest.destination[0], tripRequest.destination[1]) / 1000;
    const candidateTransferPoints = transferPointsWithDistance.filter((transferPoint) => transferPoint.distanceFromOrigin <= distanceFromOriginToDestination / 2);

    return candidateTransferPoints;
}

function getTotalDistance(coords: [number, number][]): number {
    let distance = 0
    for (let i = 0; i < coords.length - 1; i++) {
        distance += calculateDistance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    }
    return distance
}

async function getPublicTransportRoute(trip: OTPTripPattern) {
    const legRoutes: {route: string, distance: number}[] = []
    for (const leg of trip.legs) {
        if (leg.mode === 'car' || leg.mode === 'foot') {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance})
            continue
        }
        const correspondingLine = availableTripsForEachLine.find((value) => value.route_short_name === leg.line.publicCode)
        if (!correspondingLine) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance})
            continue
        }
        const lineFrom = leg.serviceJourney.quays[0].name
        const lineTo = leg.serviceJourney.quays[leg.serviceJourney.quays.length - 1].name
        const correspondingTrip = correspondingLine.trips.find((trip) => trip.stops === `${lineFrom} -> ${lineTo}`)
        if (!correspondingTrip) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance})
            continue
        }
        const tripResponse = await fetch(`${Deno.env.get('LISSY_API_URL')}/getShape?shape_id=${correspondingTrip.shape_id}`, {
            method: "GET",
            headers: {
                "Authorization": Deno.env.get("LISSY_API_KEY"),
            }
        })
        if (!tripResponse.ok) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance})
            continue
        }
        const tripJson = await tripResponse.json()
        let routeCoords = tripJson.coords as [number, number][][]
        const beginningStopIndex = tripJson.stops.findIndex((val) => val.stop_name === leg.fromPlace.name)
        const endingStopIndex = tripJson.stops.findIndex((val) => val.stop_name === leg.toPlace.name)
        if (beginningStopIndex === -1 || endingStopIndex === -1) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance})
            continue
        }
        const routeCoordsFlatten = routeCoords.slice(beginningStopIndex, endingStopIndex).flat()
        const distance = getTotalDistance(routeCoordsFlatten)
        if (distance === 0) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance})
        }
        else {
            legRoutes.push({route: polyline.encode(routeCoordsFlatten), distance: distance})
        }
    }
    return legRoutes;
}

async function convertOTPDataToTripResult(trip: OTPTripPattern): Promise<TripResult> {
    const totalTransfers = calculateTotalNumberOfTransfers(trip)
    if (availableTripsForEachLine.length === 0) {
        return {
            totalTime: trip.duration,
            totalDistance: trip.distance,
            startTime: trip.aimedStartTime,
            endTime: trip.aimedEndTime,
            legs: trip.legs.map((leg) => ({
                startTime: leg.aimedStartTime,
                endTime: leg.aimedEndTime,
                modeOfTransport: leg.mode,
                from: leg.fromPlace.name,
                to: leg.toPlace.name,
                distance: leg.distance,
                line: leg.line?.publicCode ?? '',
                route: leg.pointsOnLink.points,
                delay: 0
            })),
            totalTransfers
        } as TripResult;
    }
    const legRoutes = await getPublicTransportRoute(trip)
    const totalDistance = legRoutes.some(leg => leg.distance === 0) ? trip.distance :
        legRoutes.reduce((acc, leg) => acc + leg.distance, 0)

    return {
        totalTime: trip.duration,
        startTime: trip.aimedStartTime,
        endTime: trip.aimedEndTime,
        totalDistance: totalDistance,
        legs: trip.legs.map((leg, idx) => ({
            startTime: leg.aimedStartTime,
            endTime: leg.aimedEndTime,
            modeOfTransport: leg.mode,
            from: leg.fromPlace.name,
            to: leg.toPlace.name,
            distance: legRoutes[idx].distance,
            line: leg.line?.publicCode ?? '',
            route: legRoutes[idx].route,
            delay: 0
        })),
        totalTransfers
    } as TripResult;
}

function calculateTotalNumberOfTransfers(publicTransport: OTPTripPattern): number {
    let totalNumberTransports = 0
    for (const leg of publicTransport.legs) {
        if (leg.mode === 'car') {
            return 0
        }
        if (leg.mode !== 'foot') {
            totalNumberTransports++
        }
    }
    return totalNumberTransports - 1
}

function mergeCarWithPublicTransport(car: TripResult, publicTransport: TripResult, transferStopName: string): TripResult {

    // Modify the results so that the destination name of car and starting name of public transport
    // is the transfer stop name (instead of generic Origin and Destination)
    car.legs[0].to = transferStopName
    publicTransport.legs[0].from = transferStopName

    const mergedResult: TripResult = {

        // Total time by car + total time by public transport + time waiting for public transport
        totalTime: car.totalTime + publicTransport.totalTime +
            (Date.parse(publicTransport.startTime) - Date.parse(car.endTime)) / 1000,
        totalDistance: car.totalDistance + publicTransport.totalDistance, // Might be inaccurate due to wrong public transport routing
        startTime: car.startTime,
        endTime: publicTransport.endTime,
        legs: [...car.legs, ...publicTransport.legs],
        totalTransfers: 1 + publicTransport.totalTransfers,
    }
    return mergedResult
}
function mergeFinalTripWithCar(finalTrip: TripResult, car: TripResult): TripResult {
    const mergedResult: TripResult = {
        totalTime: finalTrip.totalTime + car.totalTime + (Date.parse(car.startTime) - Date.parse(finalTrip.endTime)) / 1000,
        totalDistance: finalTrip.totalDistance + car.totalDistance,
        startTime: finalTrip.startTime,
        endTime: car.endTime,
        legs: [...finalTrip.legs, ...car.legs],
        totalTransfers: finalTrip.totalTransfers + 1

    }
    
    return mergedResult
}

async function getFromPickupPointToDestination(trip: TripResult, tripRequest: TripRequest): Promise<TripResult> {
    const beginning = addMinutes(trip.legs[trip.legs.length - 1].endTime, 1)
    const carTrip = await getRouteByCar(tripRequest.preferences.pickupCoords, tripRequest.destination, beginning)
    const carResult = await convertOTPDataToTripResult(carTrip.trip.tripPatterns[0])
    return mergeFinalTripWithCar(trip, carResult)
}

export async function calculateRoutes(tripRequest: TripRequest): Promise<TripResponse> {
    let candidateTransferPoints: TransferStop[] = []
    let tripResults: TripResult[] = []

    const { preferences, origin, destination, departureDateTime } = tripRequest
    const pickupPointSet = preferences.pickupCoords[0] !== 1000 && preferences.pickupCoords[1] !== 1000
    const finalDestination =  pickupPointSet ? preferences.pickupCoords : destination

    candidateTransferPoints = preferences.transferStop ?
        [preferences.transferStop] : getCandidateTransferStops(tripRequest)


    // No candidate stops were found
    if (candidateTransferPoints.length === 0) {
        const tripPublicTransport: OTPGraphQLData = await getRouteByPublicTransport(origin, finalDestination,
            departureDateTime, preferences.modeOfTransport)
        const publicTransportResultsPromises = tripPublicTransport.trip.tripPatterns.map((tripPattern) => convertOTPDataToTripResult(tripPattern))
        const publicTransportResults = await Promise.all(publicTransportResultsPromises)
        tripResults = [...publicTransportResults]
    }

    else if (candidateTransferPoints.length > 15 && !preferences.findBestTrip) {
        candidateTransferPoints = await getRepresentativeTransferStops(candidateTransferPoints)
    }
    for (const candidate of candidateTransferPoints) {
        const tripCar: OTPGraphQLData = await getRouteByCar(origin, candidate.stopCoords, departureDateTime)
        const carPatterns = tripCar.trip.tripPatterns
        if (carPatterns.length === 0) {
            continue
        }
        const carResult = await convertOTPDataToTripResult(carPatterns[0])

        const tripPublicTransport: OTPGraphQLData = await getRouteByPublicTransport(candidate.stopCoords, finalDestination,
            addMinutes(carPatterns[0].aimedEndTime, 5), preferences.modeOfTransport)

        const publicTransportResultsPromises = tripPublicTransport.trip.tripPatterns.map(convertOTPDataToTripResult)
        const publicTransportResults = await Promise.all(publicTransportResultsPromises)

        const mergedResults = publicTransportResults.map(publicResult => mergeCarWithPublicTransport(carResult, publicResult, candidate.stopName))
        tripResults.push(...mergedResults)
    }
    const bestTrips = findBestTrips(tripResults)
    
    // If pickup point is set
    if (pickupPointSet) {
        for (let i = 0; i < bestTrips.length; i++) {
            bestTrips[i] = await getFromPickupPointToDestination(bestTrips[i], tripRequest)
        }
    }

    return { outboundTrips: bestTrips, returnTrips: []}
}
import { getRouteByCar, getRouteByPublicTransport, calculateDistance, addMinutes } from "./common/common.ts";
import { getRepresentativeTransferStops } from "./cluster.ts";

import type { TripRequest } from "./types/TripRequest.ts";
import type { TripResult, TripResponse } from "../types/TripResult.ts";
import type { TransferStopWithDistance } from "./types/TransferStopWithDistance.ts";
import { transferStops, availableTripsByLines, availableDate } from "./api.ts";
import type { OTPGraphQLData, OTPTripLeg, OTPTripPattern } from "./types/OTPGraphQLData.ts";
import { findBestTrips } from "./transferStopSelector.ts";
import {TransferStop} from "../types/TransferStop.ts";
import polyline from 'polyline'


/**
 * Retrieves the candidate transfer stops for a trip request that are too far from the destination.
 * @param tripRequest The trip request
 * @returns Candidate transfer stops
 */
function getCandidateTransferStops(tripRequest: TripRequest): TransferStopWithDistance[] {
    // TODO when pickup point is set let destination be probably that pickup point
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

function convertStringTimeToUnix(tripLeg: OTPTripLeg): number {
    const [hours, minutes] = tripLeg.serviceJourney.passingTimes[0].departure.time.split(":").map(Number)
    const date = new Date(1970, 0, 1, hours, minutes)
    return date.valueOf()
}

/**
 * Looks for the nearest delay info for given stop when info for a given stop
 * is not available
 * @param delaysForTrip All delays for different stop segments on a trip 
 * @param endingStopIndex Index of a stop for which delay is needed
 * @returns The nearest delay information
 */
function findNearestDelay(delaysForTrip: Record<string, any>, endingStopIndex: number): string {
    const possibleDelay = delaysForTrip[(endingStopIndex - 1).toString()]
    let nearestDelay = null
    let minDistance = Infinity

    if (!possibleDelay) {
        for (const key of Object.keys(delaysForTrip)) {
            const numericKey = Number(key)
            if (numericKey < endingStopIndex - 1) {
                const distance = endingStopIndex - 1 - numericKey
                if (distance < minDistance) {
                    minDistance = distance
                    nearestDelay = delaysForTrip[key]
                }
            }
        }
        return nearestDelay
    }
    return possibleDelay
}

async function getPublicTransportRoute(trip: OTPTripPattern) {
    const legRoutes: {route: string, distance: number, delay: number}[] = []
    for (const leg of trip.legs) {
        let legDelay = 0

        // Skip car and foot (route automatic, no delay)
        if (leg.mode === 'car' || leg.mode === 'foot') {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delay: legDelay})
            continue
        }
        const lineFrom = leg.serviceJourney.quays[0].name
        const lineTo = leg.serviceJourney.quays[leg.serviceJourney.quays.length - 1].name
        let correspondingTrips: any =[]

        // Get all trips which are on the same line and have the same start stop and end stop
        // (might have different routes or skip some stops)
        for (const line of availableTripsByLines) {
            correspondingTrips = line.filter((trip) => trip.stops === `${lineFrom} -> ${lineTo}`)
            if (correspondingTrips.length > 0) {
                break
            }
        }
        if (correspondingTrips.length === 0) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delay: legDelay})
            continue
        }
        // For each trip, fetch its route and stops
        const tripFetches = correspondingTrips.map((t) => {
            return fetch(`${Deno.env.get("LISSY_API_URL")}/shapes/getShape?shape_id=${t.shape_id}`, {
                method: "GET",
                headers: {
                    "Authorization": Deno.env.get("LISSY_API_KEY")
                }
            })
        })
        const tripResponses = await Promise.all(tripFetches)
        const tripJsons = await Promise.all(tripResponses.map((a) => a.json()))


        let validTripRoute = {}
        let validTrip = {}

        // Find the correct trip based on the total number of stops they include
        for (let i = 0; i < tripJsons.length; i++) {
            if (tripJsons[i].stops.length === leg.serviceJourney.quays.length) {
                validTripRoute = tripJsons[i]
                validTrip = correspondingTrips[i]
                break
            }
        }

        const routeCoords = validTripRoute.coords as [number, number][][]
        const beginningStopIndex = leg.serviceJourney.quays.findIndex((quay) => quay.id === leg.fromPlace.quay.id)
        const endingStopIndex = leg.serviceJourney.quays.findIndex((quay) => quay.id === leg.toPlace.quay.id)

        const firstStopTimeOfDeparture = convertStringTimeToUnix(leg)
        if (Object.keys(validTrip).length > 0) {
            
            // Find a trip with the correct departure time
            const foundTrip = validTrip.trips.find((t) => t.dep_time === firstStopTimeOfDeparture)
            if (foundTrip) {

                // Fetch delays for the trip
                const delayResponse = await fetch(`${Deno.env.get('LISSY_API_URL')}/delayTrips/getTripData?dates=[[${availableDate},${availableDate}]]&trip_id=${foundTrip.id}`, {
                    method: "GET",
                    headers: {
                        "Authorization": Deno.env.get("LISSY_API_KEY"),
                    }
                })
                const delayJson = await delayResponse.json()
                if (Object.keys(delayJson).length > 0) {

                    // Choose the last point before the destination as the delay
                    const endSegmentDelay = findNearestDelay(delayJson[availableDate.toString()], endingStopIndex)
                    const maxKey = Math.max(...Object.keys(endSegmentDelay).map(Number))
                    legDelay = endSegmentDelay[maxKey.toString()]
                }
                
            }
            else {
                console.log("not found")
            }
            if (beginningStopIndex === -1 || endingStopIndex === -1) {
                legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delay: legDelay})
                continue
            }
            const routeCoordsFlatten = routeCoords.slice(beginningStopIndex, endingStopIndex).flat()
            const distance = getTotalDistance(routeCoordsFlatten)
    
            if (distance === 0) {
                legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delay: legDelay})
            }
            else {
                legRoutes.push({route: polyline.encode(routeCoordsFlatten), distance: distance, delay: legDelay})
            }
        }
        else {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delay: legDelay})
        }

    }
    return legRoutes;
}

async function convertOTPDataToTripResult(trip: OTPTripPattern): Promise<TripResult> {
    const totalTransfers = calculateTotalNumberOfTransfers(trip)
    if (availableTripsByLines.length === 0) {
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
            delay: legRoutes[idx].delay
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
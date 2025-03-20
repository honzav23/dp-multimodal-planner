import { getRouteByCar, getPublicTransportTrip, calculateDistance, addMinutes } from "./common/common.ts";
import { getRepresentativeTransferStops } from "./cluster.ts";

import type { TripRequest } from "./types/TripRequest.ts";
import type { TripResult, TripResponse, DelayInfo } from "../types/TripResult.ts";
import type { TransferStopWithDistance } from "./types/TransferStopWithDistance.ts";
import { transferStops, availableTripsByLines } from "./api.ts";
import { getLegsRoutesAndDelays } from "./transportRoutesWithDelays.ts";
import type { OTPGraphQLData, OTPTripPattern } from "./types/OTPGraphQLData.ts";
import { findBestTrips } from "./transferStopSelector.ts";
import {TransferStop} from "../types/TransferStop.ts";


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
    const candidateTransferPoints = transferPointsWithDistance.filter((transferPoint) => transferPoint.distanceFromOrigin <= distanceFromOriginToDestination);

    return candidateTransferPoints;
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
                delayInfo: [],
                averageDelay: 0
            })),
            totalTransfers
        } as TripResult;
    }
    const legRoutesAndDelays = await getLegsRoutesAndDelays(trip)
    const totalDistance = legRoutesAndDelays.some(leg => leg.distance === 0) ? trip.distance :
        legRoutesAndDelays.reduce((acc, leg) => acc + leg.distance, 0)

    const calculateAverageDelay = (delayInfo: DelayInfo[]): number => {
        const totalDelay = delayInfo.reduce((acc, v) => acc + v.delay, 0)
        return Math.round(totalDelay / delayInfo.length)
    }

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
            distance: legRoutesAndDelays[idx].distance,
            line: leg.line?.publicCode ?? '',
            route: legRoutesAndDelays[idx].route,
            delayInfo: legRoutesAndDelays[idx].delayInfo,
            averageDelay: calculateAverageDelay(legRoutesAndDelays[idx].delayInfo)
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

async function fetchTripsBackToTransferPoints(bestTrips: TripResult[], tripRequest: TripRequest) {
    const transferStopsUsedInTrips: {name: string, coords: [number, number]}[] = []
    for (const trip of bestTrips) {

        // Car was not used so the transfer point is the origin of the trip
        if (trip.legs[0].modeOfTransport !== "car") {
            if (!transferStopsUsedInTrips.find((t) => t.name === trip.legs[0].from)) {
                transferStopsUsedInTrips.push({name: trip.legs[0].from, coords: [1000, 1000]})
            }
        }
        else {
            if (!transferStopsUsedInTrips.find((t) => t.name === trip.legs[0].to)) {
                transferStopsUsedInTrips.push({name: trip.legs[0].to, coords: [1000, 1000]})
            }
        }
    }
    // Finding transfer stops coordinates
    for (let i = 0; i < transferStopsUsedInTrips.length; i++) {
        if (transferStopsUsedInTrips[i].name === "Origin") {
            transferStopsUsedInTrips[i].coords = tripRequest.origin
        }
        else {
            const foundTransferStop = transferStops.find((t) => t.stopName === transferStopsUsedInTrips[i].name)
            if (foundTransferStop) {
                transferStopsUsedInTrips[i].coords = foundTransferStop.stopCoords
            }
        }
    }
    // Make OTP requests to fetch the trip for public transport
    const returnTripPromises = transferStopsUsedInTrips.map((trip) => getPublicTransportTrip(tripRequest.destination, trip.coords,
        tripRequest.preferences.comingBack!.returnDateTime, tripRequest.preferences.modeOfTransport, 5)
    )
    const returnTripResponses: OTPGraphQLData[] = await Promise.all(returnTripPromises)

    // For each trip set the destination name to the transfer stop name
    for (let i = 0; i < returnTripResponses.length; i++) {
        for (let j = 0; j < returnTripResponses[i].trip.tripPatterns.length; j++) {
            const legsLen = returnTripResponses[i].trip.tripPatterns[j].legs.length
            returnTripResponses[i].trip.tripPatterns[j].legs[legsLen-1].toPlace.name = transferStopsUsedInTrips[i].name
        }
    }

    let tripPatterns: OTPTripPattern[] = []
    for (const trip of returnTripResponses) {
        tripPatterns = [...tripPatterns, ...trip.trip.tripPatterns]
    }

    const returnTripResultsPromises = tripPatterns.map((trip) => convertOTPDataToTripResult(trip))
    const returnTripResults = await Promise.all(returnTripResultsPromises)

    return returnTripResults
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
        const tripPublicTransport: OTPGraphQLData = await getPublicTransportTrip(origin, finalDestination,
            departureDateTime, preferences.modeOfTransport, 12)
        const publicTransportResultsPromises = tripPublicTransport.trip.tripPatterns.map((tripPattern) => convertOTPDataToTripResult(tripPattern))
        const publicTransportResults = await Promise.all(publicTransportResultsPromises)
        tripResults = [...publicTransportResults]
    }
    else if (candidateTransferPoints.length > 15 && !preferences.findBestTrip) {
        candidateTransferPoints = await getRepresentativeTransferStops(candidateTransferPoints)
    }
    console.time()
    const carPromises = candidateTransferPoints.map((c) => getRouteByCar(origin, c.stopCoords, departureDateTime))
    const carResponses = await Promise.all(carPromises)
    const candidateAndCar: { candidate: TransferStop, car:  TripResult}[] = []
    for (let i = 0; i < candidateTransferPoints.length; i++) {
        if (carResponses[i].trip.tripPatterns.length === 0) {
            continue
        }
        const car = await convertOTPDataToTripResult(carResponses[i].trip.tripPatterns[0])
        candidateAndCar.push({ candidate: candidateTransferPoints[i], car})
    }

    const ptPromises = candidateAndCar.map((c) => getPublicTransportTrip(c.candidate.stopCoords, finalDestination,
        addMinutes(c.car.endTime, 5), preferences.modeOfTransport, 12))
    const ptResponses: OTPGraphQLData[] = await Promise.all(ptPromises)


    const ptTripResultsForCandidates: TripResult[][] = []
    for (let i = 0; i < ptResponses.length; i++) {
        const candidateTripPromises = ptResponses[i].trip.tripPatterns.map((trip) => convertOTPDataToTripResult(trip))
        const candidateTripResults = await Promise.all(candidateTripPromises)
        ptTripResultsForCandidates.push(candidateTripResults)
    }

    for (let i = 0; i < candidateAndCar.length; i++) {
        const candidate = candidateAndCar[i]
        const pTrips = ptTripResultsForCandidates[i]
        for (const trip of pTrips) {
            tripResults.push(mergeCarWithPublicTransport(candidate.car, trip, candidate.candidate.stopName))
        }
    }

    // ///// Original fetching mechanism
    // for (const candidate of candidateTransferPoints) {
    //     const tripCar: OTPGraphQLData = await getRouteByCar(origin, candidate.stopCoords, departureDateTime)
    //     const carPatterns = tripCar.trip.tripPatterns
    //     if (carPatterns.length === 0) {
    //         continue
    //     }
    //     const carResult = await convertOTPDataToTripResult(carPatterns[0])
    //     const tripPublicTransport: OTPGraphQLData = await getPublicTransportTrip(candidate.stopCoords, finalDestination,
    //         addMinutes(carPatterns[0].aimedEndTime, 5), preferences.modeOfTransport, 12)
    //     const publicTransportResultsPromises = tripPublicTransport.trip.tripPatterns.map(convertOTPDataToTripResult)
    //     const publicTransportResults = await Promise.all(publicTransportResultsPromises)
    //
    //     const mergedResults = publicTransportResults.map(publicResult => mergeCarWithPublicTransport(carResult, publicResult, candidate.stopName))
    //     tripResults.push(...mergedResults)
    // }
    console.timeEnd()
    ////////////////////////////
    const bestTrips = findBestTrips(tripResults)
    
    // If pickup point is set
    if (pickupPointSet) {
        for (let i = 0; i < bestTrips.length; i++) {
            bestTrips[i] = await getFromPickupPointToDestination(bestTrips[i], tripRequest)
        }
    }

    // Fetch also trips that go from destination to the transfer point
    if (preferences.comingBack) {
        const returnTrips = await fetchTripsBackToTransferPoints(bestTrips, tripRequest)
        return { outboundTrips: bestTrips, returnTrips }
    }

    return { outboundTrips: bestTrips, returnTrips: []}
}
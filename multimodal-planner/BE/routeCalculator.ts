/**
 * @file routeCalculator.tsx
 * @brief Entry point for the best trips calculation, trip request comes in
 * and the best trips come out
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

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
import { fetchReturnTrips } from "./returnTrips.ts";

function pickupPointSet(pickupPoint: [number, number]): boolean {
    return pickupPoint[0] !== 1000 && pickupPoint[1] !== 1000
}

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
    let distanceFromOriginToDestination = 0

    // If pickup point is set then the pickup point is the destination
    if (pickupPointSet(tripRequest.preferences.pickupCoords)) {
        distanceFromOriginToDestination = calculateDistance(tripRequest.origin[0], tripRequest.origin[1], 
            tripRequest.preferences.pickupCoords[0], tripRequest.preferences.pickupCoords[1]) / 1000;
    }
    else {
        distanceFromOriginToDestination = calculateDistance(tripRequest.origin[0], tripRequest.origin[1], tripRequest.destination[0], tripRequest.destination[1]) / 1000;
    }
    const candidateTransferPoints = transferPointsWithDistance.filter((transferPoint) => transferPoint.distanceFromOrigin <= distanceFromOriginToDestination);

    return candidateTransferPoints;
}

/**
 * Converts a trip from the representation returned by OTP
 * to internal representation
 * @param trip Raw trip returned by OTP
 * @returns Trip converted to TripResult
 */
export async function convertOTPDataToTripResult(trip: OTPTripPattern): Promise<TripResult> {
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
                averageDelay: 0,
            })),
            totalTransfers,
            totalEmissions: 0,
            via: '',
            lowestTime: false,
            lowestEmissions: false
        } as TripResult;
   }
    const legRoutesAndDelays = await getLegsRoutesAndDelays(trip)
    const totalDistance = legRoutesAndDelays.some(leg => leg.distance === 0) ? trip.distance :
        legRoutesAndDelays.reduce((acc, leg) => acc + leg.distance, 0)

    /**
     * Calculates the average delay for given delays
     * @param delayInfo Delays to calculate the average value from
     * @returns Average delay
     */    
    const calculateAverageDelay = (delayInfo: DelayInfo[]): number => {
        const totalDelay = delayInfo.reduce((acc, v) => acc + v.delay, 0)
        if (delayInfo.length === 0) {
            return  0
        }
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
        totalTransfers,
        totalEmissions: 0,
        via: ''
    } as TripResult;
}

/**
 * Calculates the number of transfers for a public transport trip
 * @param publicTransport Public transport trip
 * @returns Number of transfers
 */
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

/**
 * Merges a trip from origin to transfer point with trip from transfer point to destination
 * @param car Trip from origin to transfer point
 * @param publicTransport Trip from transfer point to destination 
 * @param transferStopName Transfer stop used for as a transfer point
 * @returns Merged trip
 */
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
        via: transferStopName,
        lowestTime: false,
        lowestEmissions: false,
        totalEmissions: 0
    }
    return mergedResult
}

/**
 * Merges the trip from origin to pickup point with the one from pickup point to destination
 * or the trip from destination to transfer point and the one from transfer point to origin
 * @param finalTrip Trip from origin to pickup point
 * @param car Trip from pickup point to destination
 * @param returnTrip Indication if the trip is back from destination to origin
 * @returns Merged trip
 */
export function mergeFinalTripWithCar(finalTrip: TripResult, car: TripResult, returnTrip: boolean): TripResult {
    const mergedResult: TripResult = {
        totalTime: finalTrip.totalTime + car.totalTime + (Date.parse(car.startTime) - Date.parse(finalTrip.endTime)) / 1000,
        totalDistance: finalTrip.totalDistance + car.totalDistance,
        startTime: finalTrip.startTime,
        endTime: car.endTime,
        legs: [...finalTrip.legs, ...car.legs],
        totalTransfers: finalTrip.totalTransfers + 1,
        via: returnTrip ? car.legs[0].from : finalTrip.legs[0].to,
        lowestTime: false,
        lowestEmissions: false,
        totalEmissions: 0
    }
    
    return mergedResult
}

/**
 * Marks the Origin and Destination fields for appropriate legs as Pickup
 * @param trips Trips to mark pickup points for
 */
function markPickupPoints(trip: TripResult) {
    const legsLength = trip.legs.length
    trip.legs[legsLength - 1].from = "Pickup",
    trip.legs[legsLength - 2].to = "Pickup"
}

/**
 * Creates a trip from pickup point to destination and is merged with the trip from origin to pickup point
 * @param trip Already created trip from origin to pickup point
 * @param tripRequest Trip request containing the pickup point coords and destination coords
 * @returns Merged trip
 */
async function getFromPickupPointToDestination(trip: TripResult, tripRequest: TripRequest): Promise<TripResult> {
    const beginning = addMinutes(trip.legs[trip.legs.length - 1].endTime, 1)
    const carTrip = await getRouteByCar(tripRequest.preferences.pickupCoords, tripRequest.destination, beginning)
    const carResult = await convertOTPDataToTripResult(carTrip.trip.tripPatterns[0])
    const mergedTrip = await mergeFinalTripWithCar(trip, carResult, false)

    markPickupPoints(mergedTrip)

    return mergedTrip
}

export async function calculateRoutes(tripRequest: TripRequest): Promise<TripResponse> {
    let candidateTransferPoints: TransferStop[] = []
    let tripResults: TripResult[] = []

    const { preferences, origin, destination, departureDateTime } = tripRequest
    const pickupPointValid = pickupPointSet(preferences.pickupCoords)
    const finalDestination =  pickupPointValid ? preferences.pickupCoords : destination

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

    // Make OTP requests for car from start to all transfer points
    const carPromises = candidateTransferPoints.map((c) => getRouteByCar(origin, c.stopCoords, departureDateTime))
    const carResponses = await Promise.all(carPromises)


    const candidateAndCar: { candidate: TransferStop, car: TripResult}[] = []
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
    const bestTrips = findBestTrips(tripResults)
    
    // If pickup point is set
    if (pickupPointValid) {
        for (let i = 0; i < bestTrips.length; i++) {
            bestTrips[i] = await getFromPickupPointToDestination(bestTrips[i], tripRequest)
        }
    }

    // Fetch also trips that go from destination to the transfer point
    if (preferences.comingBack) {
        const returnTrips = await fetchReturnTrips(bestTrips, tripRequest)

        // Sort the return trips by transfer stop
        returnTrips.sort((a, b) => {
            return a.via.localeCompare(b.via)
        })
        return { outboundTrips: bestTrips, returnTrips }
    }

    return { outboundTrips: bestTrips, returnTrips: []}
}
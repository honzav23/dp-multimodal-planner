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
import type {TripResult, TripLeg, TripResponse, DelaysForLeg} from "../types/TripResult.ts";
import type { TransferStopWithDistance } from "./types/TransferStopWithDistance.ts";
import { transferStops, availableTripsByLines } from "./api.ts";
import {
    findCorrespondingTrips,
    findCorrectTripFromCorrespondingTrips,
    getLegRoute, getLegDelays
} from "./transportRoutesWithDelays.ts";
import type { OTPGraphQLTrip, OTPTripPattern, OTPTripLeg } from "./types/OTPGraphQLData.ts";
import { findBestTrips } from "./transferStopSelector.ts";
import {TransferStop} from "../types/TransferStop.ts";
import { fetchReturnTrips } from "./returnTrips.ts";
import {TransportMode} from "../types/TransportMode.ts";

const TRANSFER_STOP_THRESHOLD = 15

function pickupPointSet(pickupPoint: [number, number]): boolean {
    return pickupPoint[0] !== 1000 && pickupPoint[1] !== 1000
}

/**
 * Gets only candidate transfer stops that are not too far from the destination.
 * @param tripRequest The trip request
 * @returns Candidate transfer stops
 */
function removeDistantTransferStops(tripRequest: TripRequest): TransferStopWithDistance[] {
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

async function getCandidateTransferStops(tripRequest: TripRequest): Promise<TransferStop[]> {
    const { preferences } = tripRequest
    let candidateTransferStops: TransferStop[] = preferences.transferStop ?
        [preferences.transferStop] : removeDistantTransferStops(tripRequest)

    if (candidateTransferStops.length > TRANSFER_STOP_THRESHOLD && !preferences.findBestTrip) {
        candidateTransferStops = await getRepresentativeTransferStops(candidateTransferStops)
    }

    return candidateTransferStops
}

/**
 * Converts a trip from the representation returned by OTP
 * to internal representation
 * @param trip Raw trip returned by OTP
 * @returns Trip converted to TripResult
 */
async function convertOTPDataToTripResult(trip: OTPTripPattern): Promise<TripResult> {
    const totalTransfers = calculateTotalNumberOfTransfers(trip)
    const baseTripResult: Partial<TripResult> = {
        totalTime: trip.duration,
        startTime: trip.aimedStartTime,
        endTime: trip.aimedEndTime,
        totalTransfers,
        totalEmissions: 0,
        via: '',
        lowestTime: false,
        lowestEmissions: false,
    }
    const createBaseLeg = (leg: OTPTripLeg): Partial<TripLeg> => ({
        startTime: leg.aimedStartTime,
        endTime: leg.aimedEndTime,
        modeOfTransport: leg.mode,
        from: leg.fromPlace.name,
        to: leg.toPlace.name,
        line: leg.line?.publicCode ?? '',
    });
    if (availableTripsByLines.length === 0) {
        return {
            ...baseTripResult,
            totalDistance: trip.distance,
            legs: trip.legs.map((leg) => ({
                ...createBaseLeg(leg),
                distance: leg.distance,
                route: leg.pointsOnLink.points,
                delays: {
                    averageDelay: 0,
                    pastDelays: [],
                    currentDelay: -1
                }
            }))
        } as TripResult;
    }
    const legRoutes: { route: string, distance: number }[] = []
    const legDelays: DelaysForLeg[] = []

    for (const leg of trip.legs) {
        if (leg.mode === 'car' || leg.mode === 'foot') {
            legRoutes.push({ route: leg.pointsOnLink.points, distance: leg.distance })
            legDelays.push({ averageDelay: 0, pastDelays: [], currentDelay: -1 })
            continue
        }
        const lineStartStop = leg.serviceJourney!.quays[0].name
        const lineEndStop = leg.serviceJourney!.quays[leg.serviceJourney!.quays.length - 1].name
        const correspondingTrips = findCorrespondingTrips(lineStartStop, lineEndStop)
        const validCorrespondingTrip = findCorrectTripFromCorrespondingTrips(correspondingTrips, leg)
        legRoutes.push(await getLegRoute(leg, validCorrespondingTrip))
        legDelays.push(await getLegDelays(leg, validCorrespondingTrip))
    }

    const totalDistance = legRoutes.some(leg => leg.distance === 0) ? trip.distance :
        legRoutes.reduce((acc, leg) => acc + leg.distance, 0)

    return {
        ...baseTripResult,
        totalDistance: totalDistance,
        legs: trip.legs.map((leg, idx) => ({
            ...createBaseLeg(leg),
            distance: legRoutes[idx].distance,
            route: legRoutes[idx].route,
            delays: {
                averageDelay: legDelays[idx].averageDelay,
                pastDelays: legDelays[idx].pastDelays,
                currentDelay: legDelays[idx].currentDelay
            }
        }))
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

function tripUsesOnlyPublicTransport(trip: TripResult): boolean {
    return trip.legs[0].modeOfTransport !== 'car'
}

/**
 * Merges the trip from origin to pickup point with the one from pickup point to destination
 * or the trip from destination to transfer point and the one from transfer point to origin
 * @param finalTrip Trip from origin to pickup point
 * @param car Trip from pickup point to destination
 * @param returnTrip Indication if the trip is back from destination to origin
 * @returns Merged trip
 */
function mergeFinalTripWithCar(finalTrip: TripResult, car: TripResult, returnTrip: boolean): TripResult {

    const getViaStopText = (): string => {
        const publicTransportTrip = tripUsesOnlyPublicTransport(finalTrip)
        if (returnTrip) {
            return car.legs[0].from
        }
        else if (publicTransportTrip) {
            return ''
        }
        return finalTrip.legs[0].to
    }

    const mergedResult: TripResult = {
        totalTime: finalTrip.totalTime + car.totalTime + (Date.parse(car.startTime) - Date.parse(finalTrip.endTime)) / 1000,
        totalDistance: finalTrip.totalDistance + car.totalDistance,
        startTime: finalTrip.startTime,
        endTime: car.endTime,
        legs: [...finalTrip.legs, ...car.legs],
        totalTransfers: finalTrip.totalTransfers + 1,
        via: getViaStopText(),
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
    const mergedTrip = mergeFinalTripWithCar(trip, carResult, false)

    markPickupPoints(mergedTrip)

    return mergedTrip
}

// Handles the case when no transfer stops are found by
// fetching only public transport trips from OTP
async function handleNoCandidateTransferStops(origin: [number, number], destination: [number, number], departureDateTime: string, modeOfTransport: TransportMode[]): Promise<TripResult[]> {
    const tripPublicTransport: OTPGraphQLTrip = await getPublicTransportTrip(origin, destination,
        departureDateTime, modeOfTransport, 12)
    const publicTransportResultsPromises = tripPublicTransport.trip.tripPatterns.map((tripPattern) => convertOTPDataToTripResult(tripPattern))
    const publicTransportResults = await Promise.all(publicTransportResultsPromises)
    return [...publicTransportResults]
}

async function getCarTripsFromOriginToEachTransferStop(candidateTransferStops: TransferStop[], origin: [number, number],
                                                       departureDateTime: string): Promise<OTPGraphQLTrip[]> {
    const carPromises = candidateTransferStops.map((c) => getRouteByCar(origin, c.stopCoords, departureDateTime))
    return await Promise.all(carPromises)
}

// Returns public transport trips for each transfer stop (usually multiple different trips)
// for one transfer stop (up to 12)
async function getPublicTransportTripsFromTransferStopToDestination(candidateStopAndCarPairs: { candidate: TransferStop, carTrip: TripResult}[],
                                                                    destination: [number, number], modeOfTransport: TransportMode[]): Promise<OTPGraphQLTrip[]> {
    const ptPromises = candidateStopAndCarPairs.map((c) => getPublicTransportTrip(c.candidate.stopCoords, destination,
        addMinutes(c.carTrip.endTime, 5), modeOfTransport, 12))
    return await Promise.all(ptPromises)
}

async function pairTransferStopWithItsCarTrip(candidateTransferStops: TransferStop[], carTripsFromOriginToEachTransferStop: OTPGraphQLTrip[]):
        Promise<{ candidate: TransferStop, carTrip: TripResult}[]> {

    const candidateAndCar: { candidate: TransferStop, carTrip: TripResult}[] = []
    for (let i = 0; i < candidateTransferStops.length; i++) {
        if (carTripsFromOriginToEachTransferStop[i].trip.tripPatterns.length === 0) {
            continue
        }
        const carTripResult = await convertOTPDataToTripResult(carTripsFromOriginToEachTransferStop[i].trip.tripPatterns[0])
        candidateAndCar.push({ candidate: candidateTransferStops[i], carTrip: carTripResult})
    }
    return candidateAndCar
}

// For each transfer stop, create an array of public transport trips
// converted to TripResult type
async function convertPublicTransportTripsToTripResults(publicTransportTripsToDestination: OTPGraphQLTrip[]): Promise<TripResult[][]> {
    const publicTransportTripResultsForCandidates: TripResult[][] = []
    for (let i = 0; i < publicTransportTripsToDestination.length; i++) {
        const candidateTripPromises = publicTransportTripsToDestination[i].trip.tripPatterns.map((trip) => convertOTPDataToTripResult(trip))
        const candidateTripResults = await Promise.all(candidateTripPromises)
        publicTransportTripResultsForCandidates.push(candidateTripResults)
    }
    return publicTransportTripResultsForCandidates
}

function mergeCarTripsWithPublicTransportTrips(candidateStopAndCarPairs: { candidate: TransferStop, carTrip: TripResult}[],
                                               publicTransportTripResultsForCandidates: TripResult[][],  tripResults: TripResult[]) {
    for (let i = 0; i < candidateStopAndCarPairs.length; i++) {
        const candidate = candidateStopAndCarPairs[i]
        const pTrips = publicTransportTripResultsForCandidates[i]
        for (const trip of pTrips) {
            tripResults.push(mergeCarWithPublicTransport(candidate.carTrip, trip, candidate.candidate.stopName))
        }
    }
}

async function handlePickupPointPreference(bestTrips: TripResult[], tripRequest: TripRequest) {
    const pickupPointValid = pickupPointSet(tripRequest.preferences.pickupCoords)
    if (pickupPointValid) {
        for (let i = 0; i < bestTrips.length; i++) {
            bestTrips[i] = await getFromPickupPointToDestination(bestTrips[i], tripRequest)
        }
    }
}

async function handleComingBackPreference(bestTrips: TripResult[], tripRequest: TripRequest): Promise<TripResult[]> {
    let returnTrips: TripResult[] = []
    if (tripRequest.preferences.comingBack) {
        returnTrips = await fetchReturnTrips(bestTrips, tripRequest)

        // Sort the return trips by transfer stop
        returnTrips.sort((a, b) => {
            return a.via.localeCompare(b.via)
        })
    }
    return returnTrips
}


async function handleAdditionalPreferences(bestTrips: TripResult[], tripRequest: TripRequest): Promise<TripResponse> {
    await handlePickupPointPreference(bestTrips, tripRequest)
    const returnTrips = await handleComingBackPreference(bestTrips, tripRequest)

    return { outboundTrips: bestTrips, returnTrips }
}

async function calculateRoutes(tripRequest: TripRequest): Promise<TripResponse> {
    let tripResults: TripResult[] = []

    const { preferences, origin, destination, departureDateTime } = tripRequest
    const pickupPointValid = pickupPointSet(preferences.pickupCoords)
    const finalDestination =  pickupPointValid ? preferences.pickupCoords : destination

    const candidateTransferStops = await getCandidateTransferStops(tripRequest)

    if (candidateTransferStops.length === 0 || preferences.useOnlyPublicTransport) {
        tripResults = await handleNoCandidateTransferStops(origin, finalDestination, departureDateTime, preferences.modeOfTransport)
    }

    if (tripResults.length === 0 && candidateTransferStops.length > 0) {
        const carTripsFromOriginToEachTransferStop = await getCarTripsFromOriginToEachTransferStop(candidateTransferStops, origin, departureDateTime)
        const candidateStopAndCarPairs = await pairTransferStopWithItsCarTrip(candidateTransferStops, carTripsFromOriginToEachTransferStop)
        const publicTransportTripsToDestination = await getPublicTransportTripsFromTransferStopToDestination(candidateStopAndCarPairs, finalDestination, preferences.modeOfTransport)

        const publicTransportTripResultsForCandidates = await convertPublicTransportTripsToTripResults(publicTransportTripsToDestination)
        mergeCarTripsWithPublicTransportTrips(candidateStopAndCarPairs, publicTransportTripResultsForCandidates, tripResults)
    }

    const bestTrips = findBestTrips(tripResults)

    const tripsWithAdditionalPreferences = await handleAdditionalPreferences(bestTrips, tripRequest)
    return tripsWithAdditionalPreferences
}

export { calculateRoutes, mergeFinalTripWithCar, convertOTPDataToTripResult, mergeCarWithPublicTransport, tripUsesOnlyPublicTransport,
    calculateTotalNumberOfTransfers }
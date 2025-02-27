import { getRouteByCar, getRouteByPublicTransport, calculateDistance } from "./common/common.ts";
import { getRepresentativeTransferStops } from "./cluster.ts";

import type { TripRequest } from "./types/TripRequest.ts";
import type { TripResult } from "../types/TripResult.ts";
import type { TransferStopWithDistance } from "./types/TransferStopWithDistance.ts";
import { transferStops } from "./main.ts";
import type { OTPGraphQLData, OTPTripPattern } from "./types/OTPGraphQLData.ts";
import { findBestTrips } from "./transferStopSelector.ts";
import {TransferStop} from "../types/TransferStop.ts";


function addMinutes(isoDate: string, minutes: number): string {
    const date = new Date(isoDate)
    date.setMinutes(date.getMinutes() + minutes)

    return date.toISOString()
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
            distanceFromOrigin: calculateDistance(tripRequest.origin[0], tripRequest.origin[1], row.stopCoords[0], row.stopCoords[1]),
        }
    });

    const distanceFromOriginToDestination = calculateDistance(tripRequest.origin[0], tripRequest.origin[1], tripRequest.destination[0], tripRequest.destination[1]);

    const candidateTransferPoints = transferPointsWithDistance.filter((transferPoint) => transferPoint.distanceFromOrigin <= distanceFromOriginToDestination / 2);

    return candidateTransferPoints;
}

function convertOTPDataToTripResult(trip: OTPTripPattern): TripResult {
    const tripResult: TripResult = {
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
            route: leg.pointsOnLink.points
        })),
        totalTransfers: 0
    };
    return tripResult
}

function calculateTotalNumberOfTransfers(publicTransport: TripResult): number {
    let totalNumberTransports = 0
    for (const leg of publicTransport.legs) {
        if (leg.modeOfTransport !== 'foot') {
            totalNumberTransports++
        }
    }
    return totalNumberTransports - 1
}

function mergePublicTransportWithCar(car: TripResult, publicTransport: TripResult, transferStopName: string): TripResult {

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
        totalTransfers: 1 + calculateTotalNumberOfTransfers(publicTransport),
    }
    return mergedResult
}

export async function calculateRoad(tripRequest: TripRequest): Promise<TripResult[]> {
    let candidateTransferPoints: TransferStop[] = []
    if (tripRequest.preferences.transferStop !== null) {
        candidateTransferPoints = [tripRequest.preferences.transferStop]
    }
    else {
        candidateTransferPoints = getCandidateTransferStops(tripRequest)
    }
    if (candidateTransferPoints.length === 0) {
        
    }

    else if (candidateTransferPoints.length > 15 && !tripRequest.preferences.findBestTrip) {
        candidateTransferPoints = await getRepresentativeTransferStops(candidateTransferPoints)
    }
    const tripResults: TripResult[] = []

    for (const candidate of candidateTransferPoints) {
        const tripCar: OTPGraphQLData = await getRouteByCar(tripRequest.origin, candidate.stopCoords, tripRequest.departureDate)
        if (tripCar.trip.tripPatterns.length > 0) {
            const carResult = convertOTPDataToTripResult(tripCar.trip.tripPatterns[0])
            const tripPublicTransport: OTPGraphQLData = await getRouteByPublicTransport(candidate.stopCoords, tripRequest.destination,
                addMinutes(tripCar.trip.tripPatterns[0].aimedEndTime, 5), tripRequest.preferences.modeOfTransport)
            const publicTransportResults = tripPublicTransport.trip.tripPatterns.map((tripPattern) => convertOTPDataToTripResult(tripPattern))
            
            const tempTripResults = publicTransportResults.map((publicResult) => mergePublicTransportWithCar(carResult, publicResult, candidate.stopName))
            tripResults.push(...tempTripResults)
        }
    }
    const bestTrips = findBestTrips(tripResults)
    return bestTrips   
}
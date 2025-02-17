import { getRouteByCar, getRouteByPublicTransport } from "./common/common.ts";

import type { TripRequest } from "./types/TripRequest.ts";
import type { TripResult } from "../types/TripResult.ts";
import type { TransferStopWithDistance } from "./types/TransferStopWithDistance.ts";
import { transferStops } from "./main.ts";
import type { OTPGraphQLData, OTPTripPattern } from "./types/OTPGraphQLData.ts";

/**
 * Calculates the distance between two points on the Earth's surface.
 * 
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * 
 * @returns The distance between the two points in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (degrees: number) => degrees * Math.PI / 180;

    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

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

function mergePublicTransportWithCar(car: TripResult, publicTransport: TripResult): TripResult {
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
    const candidateTransferPoints = getCandidateTransferStops(tripRequest);
    if (tripRequest.preferences.transferStop !== null) {

        // First create a trip from the source location to the transfer point
        const tripCar: OTPGraphQLData = await getRouteByCar(tripRequest.origin, tripRequest.preferences.transferStop.stopCoords, tripRequest.departureDate)
        
        // Then create a trip from the transfer point to destination with delayed departure time so that there is time between
        // the transfer from a car to public transport   
        const tripPublicTransport: OTPGraphQLData = await getRouteByPublicTransport(tripRequest.preferences.transferStop.stopCoords, tripRequest.destination,
            addMinutes(tripCar.trip.tripPatterns[0].aimedEndTime, 5), tripRequest.preferences.modeOfTransport)

        // There is only one trip for a car
        const carResult = convertOTPDataToTripResult(tripCar.trip.tripPatterns[0])
        const publicTransportResults = tripPublicTransport.trip.tripPatterns.map((tripPattern) => convertOTPDataToTripResult(tripPattern))

        const tripResults = publicTransportResults.map((publicResult) => mergePublicTransportWithCar(carResult, publicResult))

        return tripResults;
    }
    else {
        for (const candidate of candidateTransferPoints) {
            const tripCar: OTPGraphQLData = await getRouteByCar(tripRequest.origin, candidate.stopCoords, tripRequest.departureDate)
            if (tripCar.trip.tripPatterns.length > 0) {
                const tripPublicTransport: OTPGraphQLData = await getRouteByPublicTransport(candidate.stopCoords, tripRequest.destination,
                    addMinutes(tripCar.trip.tripPatterns[0].aimedEndTime, 5), tripRequest.preferences.modeOfTransport)
            }
        }
        console.log("done")
        return []
    }
    
    return [];
}
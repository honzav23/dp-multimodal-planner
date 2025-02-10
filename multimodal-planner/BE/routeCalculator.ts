import { gql, request } from "https://deno.land/x/graphql_request/mod.ts";
import { getRouteByCar } from "./common/common.ts";

import type { TripRequest } from "./types/TripRequest";
import type { TripResult, TripLeg } from "../types/TripResult";
import type { TransferStopWithDistance } from "./types/TransferStopWithDistance";
import { transferStops } from "./main.ts";
import {OTPGraphQLData} from "./types/OTPGraphQLData";

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

/**
 * Retrieves the candidate transfer stops for a trip request that are too far from the destination.
 * @param tripRequest The trip request
 * @returns Candidate transfer stops
 */
async function getCandidateTransferStops(tripRequest: TripRequest): Promise<TransferStopWithDistance[]> {

    const transferPointsWithDistance: TransferStopWithDistance[] = transferStops.map((row) => {
        return {
            ...row,
            distanceFromOrigin: calculateDistance(tripRequest.origin[0], tripRequest.origin[1], row.stopLat, row.stopLon),
        }
    });

    const distanceFromOriginToDestination = calculateDistance(tripRequest.origin[0], tripRequest.origin[1], tripRequest.destination[0], tripRequest.destination[1]);

    const candidateTransferPoints = transferPointsWithDistance.filter((transferPoint) => transferPoint.distanceFromOrigin < distanceFromOriginToDestination);

    return candidateTransferPoints;
}

function createTripResults(trips): TripResult[] {
    const tripResults: TripResult[] = [];
    for (let trip of trips) {
        const tripResult = {
            totalTime: trip.duration,
            totalDistance: trip.distance,
            startTime: trip.aimedStartTime,
            endTime: trip.aimedEndTime,
            legs: []
        }
        for (let tripLeg of trip.legs) {
            const newTripLeg: TripLeg = {
                startTime: tripLeg.aimedStartTime,
                endTime: tripLeg.aimedEndTime,
                modeOfTransport: tripLeg.mode,
                from: tripLeg.fromPlace.name,
                to: tripLeg.toPlace.name,
                line: tripLeg.line?.publicCode ?? '',
                route: tripLeg.pointsOnLink.points
            }
            tripResult.legs.push(newTripLeg);
        }
        tripResults.push(tripResult);
    }
    return tripResults
}

export async function calculateRoad(tripRequest: TripRequest): Promise<TripResult[]> {
    const candidateTransferPoints = await getCandidateTransferStops(tripRequest);
    if (tripRequest.preferences.transferStop !== null) {
        const trip: OTPGraphQLData = await getRouteByCar(tripRequest.origin, tripRequest.preferences.transferStop.stopCoords, tripRequest.departureDate)
        const results = createTripResults(trip.trip.tripPatterns);
        return results;
    }
    
    return [];
}
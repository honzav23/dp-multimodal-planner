/**
 * @file returnTrips.ts
 * @brief This file deals with the case when the user specifies
 * that he wants to go back (from destination to start) on certain date
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import type {TripResult} from "../types/TripResult.ts";
import type {TripRequest} from "./types/TripRequest.ts";
import type { TransferStopInTrip } from "./types/TransferStopInTrip.ts";
import {transferStops} from "./api.ts";
import {addMinutes, getPublicTransportTrip, getRouteByCar} from "./common/common.ts";
import type {OTPGraphQLData, OTPTripPattern} from "./types/OTPGraphQLData.ts";
import {convertOTPDataToTripResult, mergeFinalTripWithCar} from "./routeCalculator.ts";

/**
 * Assign coordinates to all transfer stops for the best trips
 * @param transferStopsForTrips Transfer stops found in best trips
 * @param tripRequest Original trip request
 */
function resolveTransferStopCoordinates(transferStopsForTrips: TransferStopInTrip[], tripRequest: TripRequest) {
    for (const stop of transferStopsForTrips) {
        if (stop.name === "Origin") {
            stop.coords = tripRequest.origin;
        } else {
            const found = transferStops.find((t) => t.stopName === stop.name);
            if (found) {
                 stop.coords = found.stopCoords;
            }
        }
    }
}

/**
 * Find all different transfer stops used in best trips
 * @param bestTrips Trips where to look for transfer stops
 * @param tripRequest Original trip request
 */
function getTransferStopsUsedInTrips(bestTrips: TripResult[], tripRequest: TripRequest): TransferStopInTrip[] {
    const transferStopsInTrips: TransferStopInTrip[] = [];

    for (const trip of bestTrips) {
        const firstLeg = trip.legs[0];
        const stopName = firstLeg.modeOfTransport !== "car" ? firstLeg.from : firstLeg.to;

        if (!transferStopsInTrips.find((t) => t.name === stopName)) {
            transferStopsInTrips.push({ name: stopName, coords: [1000, 1000] });
        }
    }
    resolveTransferStopCoordinates(transferStopsInTrips, tripRequest);

    return transferStopsInTrips;
}


function setDestinationNamesForReturnTrips(returnTrips: OTPGraphQLData[], transferStopsInTrips: TransferStopInTrip[]) {
    for (let i = 0; i < returnTrips.length; i++) {
        for (let j = 0; j < returnTrips[i].trip.tripPatterns.length; j++) {
            const legsLen = returnTrips[i].trip.tripPatterns[j].legs.length
            returnTrips[i].trip.tripPatterns[j].legs[legsLen-1].toPlace.name = transferStopsInTrips[i].name
        }
    }
}

async function processCarTrips(transferStopsInTrips: TransferStopInTrip[], tripResultsForTransferStops: TripResult[][], tripRequest: TripRequest): Promise<TripResult[]> {
    const carPatternsByStopResponses: OTPGraphQLData[][] = []
    const indicesToDelete: number[] = []
    // For each transfer stop and each trip pattern of public transport in it, create a request for car
    for (let i = 0; i < transferStopsInTrips.length; i++) {
        const carPatternsPromises = tripResultsForTransferStops[i].map((trip) => getRouteByCar(transferStopsInTrips[i].coords, tripRequest.origin, addMinutes(trip.endTime, 1)))
        const carPatternsResponses = await Promise.all(carPatternsPromises)
        const carPatternsResponsesNotEmpty = carPatternsResponses.every((c) => c.trip.tripPatterns.length > 0)

        // If no car trip is found for any of the results for a certain transfer stops, don't push it to responses
        if (!carPatternsResponsesNotEmpty) {
            indicesToDelete.push(i)
        }
        else {
            carPatternsByStopResponses.push(carPatternsResponses)
        }
    }

    // Remove all the transfer stops which don't have any car trip
    if (indicesToDelete.length > 0) {
        // nnnnnn, (2012, 02 24). Remove multiple elements from array in Javascript/jQuery. Stack Overflow. https://stackoverflow.com/questions/9425009/remove-multiple-elements-from-array-in-javascript-jquery
        for (let i = indicesToDelete.length - 1; i >= 0; i--) {
            transferStopsInTrips.splice(indicesToDelete[i], 1);
        }
    }

    // Leave only one trip pattern for each
    const carPatternForStops = carPatternsByStopResponses.map((car) => {
        return car.map((c) => c.trip.tripPatterns[0])
    })


    // Set the name of the place of departure for car as the name of the trasnfer stop
    for (let i = 0; i < transferStopsInTrips.length; i++) {
        for (let j = 0; j < carPatternForStops[i].length; j++) {
            carPatternForStops[i][j].legs[0].fromPlace.name = transferStopsInTrips[i].name
        }
    }

    const carPatternForStopsFlatten = carPatternForStops.flat()
    const carTripsPromises = carPatternForStopsFlatten.map(convertOTPDataToTripResult)
    return (await Promise.all(carTripsPromises))
}

export async function fetchTripsBackToTransferPoints(bestTrips: TripResult[], tripRequest: TripRequest) {
    const transferStopsUsedInTrips = getTransferStopsUsedInTrips(bestTrips, tripRequest);

    // Make OTP requests to fetch the public transport trips for each transfer stop
    const returnTripPromises = transferStopsUsedInTrips.map((trip) => getPublicTransportTrip(tripRequest.destination, trip.coords,
        tripRequest.preferences.comingBack!.returnDateTime, tripRequest.preferences.modeOfTransport, 5)
    )
    const returnTripResponses: OTPGraphQLData[] = await Promise.all(returnTripPromises)

    setDestinationNamesForReturnTrips(returnTripResponses, transferStopsUsedInTrips)

    // For each transfer stop have a few trip patterns
    const tripPatternsForTransferStops: OTPTripPattern[][] = returnTripResponses.map((trip) => trip.trip.tripPatterns)

    // Convert all the trip patterns to TripResult type
    const tripResultsForTransferStops = await Promise.all(tripPatternsForTransferStops.map(async (tripPatternsForStop) => {
        const tripPatternsTransferStopPromises = tripPatternsForStop.map(convertOTPDataToTripResult)
        return await Promise.all(tripPatternsTransferStopPromises)
    }))
    const carTripsResponses = await processCarTrips(transferStopsUsedInTrips, tripResultsForTransferStops, tripRequest);

    const tripResultsForTransferStopsFlatten = tripResultsForTransferStops.flat()

    const returnTripResults = []
    for (let i = 0; i < carTripsResponses.length; i++) {
        returnTripResults.push(mergeFinalTripWithCar(tripResultsForTransferStopsFlatten[i], carTripsResponses[i], true))
    }

    return returnTripResults
}
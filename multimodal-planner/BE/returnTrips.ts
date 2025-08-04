/**
 * @file returnTrips.ts
 * @brief This file deals with the case when the user specifies
 * that he wants to go back (from destination to start) on certain date
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type {TripResult} from "../types/TripResult.ts";
import type {TripRequest} from "./types/TripRequest.ts";
import type { TransferStopInTrip } from "./types/TransferStopInTrip.ts";
import {transferStops} from "./api.ts";
import {addSeconds} from "./common/common.ts";
import { getCarTrip, getPublicTransportTrip } from "./common/otpRequests.ts"
import type {OTPGraphQLTrip, OTPTripPattern} from "./types/OTPGraphQLData.ts";
import {convertOTPDataToTripResult, mergeFinalTripWithCar, tripUsesOnlyPublicTransport} from "./routeCalculator.ts";

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

/**
 * Set the destination name for each public transport trip to the name of the particular transfer stop
 * (by default it is 'Destination')
 * @param tripPatternsForTransferStops Public transport trips from destination to the transfer stop
 * @param transferStopsInTrips Transfer stops used in outbound trips
 */
function setDestinationNamesForPublicTransportTrips(tripPatternsForTransferStops: OTPTripPattern[][], transferStopsInTrips: TransferStopInTrip[]) {
    for (let i = 0; i < tripPatternsForTransferStops.length; i++) {
        for (let j = 0; j < tripPatternsForTransferStops[i].length; j++) {
            const legsLen = tripPatternsForTransferStops[i][j].legs.length
            tripPatternsForTransferStops[i][j].legs[legsLen-1].toPlace.name = transferStopsInTrips[i].name
        }
    }
}

/**
 * Create car trip for each public transport trip for each transfer stop
 * @param transferStopsInTrips All transfer stops used in outbound trips
 * @param tripResultsForTransferStops Public transport trips from destination to transfer stops
 * @param tripRequest Original trip request
 * @returns Car trips for each public transport trip for each transfer stop
 */
async function processCarTrips(transferStopsInTrips: TransferStopInTrip[], tripResultsForTransferStops: TripResult[][], tripRequest: TripRequest): Promise<TripResult[]> {
    const carPatternsByStopResponses: OTPGraphQLTrip[][] = []
    const indicesToDelete: number[] = []

    // For each transfer stop and each trip pattern of public transport in it, create a request for car
    for (let i = 0; i < transferStopsInTrips.length; i++) {
        const carPatternsPromises = tripResultsForTransferStops[i].map((trip) => getCarTrip(transferStopsInTrips[i].coords, tripRequest.origin, addSeconds(trip.endTime, 60)))
        const carPatternsResponses = await Promise.all(carPatternsPromises)
        const carPatternsResponsesEmpty = !carPatternsResponses.every((c) => c.trip.tripPatterns.length > 0)

        // If no car trip is found for any of the results for a certain transfer stops, don't push it to responses
        if (carPatternsResponsesEmpty) {
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
            tripResultsForTransferStops.splice(indicesToDelete[i], 1);
        }
    }

    // Leave only one trip pattern for each
    const carPatternForStops = carPatternsByStopResponses.map((car) => {
        return car.map((c) => c.trip.tripPatterns[0])
    })


    // Set the name of the place of departure for car as the name of the transfer stop
    for (let i = 0; i < transferStopsInTrips.length; i++) {
        for (let j = 0; j < carPatternForStops[i].length; j++) {
            carPatternForStops[i][j].legs[0].fromPlace.name = transferStopsInTrips[i].name
        }
    }
    const carPatternForStopsFlatten = carPatternForStops.flat()
    const carTripsPromises = carPatternForStopsFlatten.map(convertOTPDataToTripResult)
    return (await Promise.all(carTripsPromises))
}

/**
 * Fetch return trips from destination to origin
 * @param bestTrips The best trips from origin to destination
 * @param tripRequest Original trip request
 * @returns Return trips
 */
async function fetchReturnTrips(bestTrips: TripResult[], tripRequest: TripRequest): Promise<TripResult[]> {

    // Distinguish between trips that include a car and trips that don't
    const groupByTransport: Partial<Record<"car" | 'public', TripResult[]>> = Object.groupBy(bestTrips, (trip) =>
      tripUsesOnlyPublicTransport(trip) ? 'public' : 'car'
    );

    let publicTransportTrips: TripResult[] = []
    const carTrips: TripResult[] = []

    if (groupByTransport.public) {
        const returnPublicTransportTrips = await getPublicTransportTrip(tripRequest.destination, tripRequest.origin, tripRequest.preferences.comingBack!.returnDateTime,
            tripRequest.preferences.modeOfTransport, 10)
        const returnPublicTransportTripResults = returnPublicTransportTrips.trip.tripPatterns.map(convertOTPDataToTripResult)
        publicTransportTrips = await Promise.all(returnPublicTransportTripResults)
    }

    if (groupByTransport.car) {
        const transferStopsUsedInTrips = getTransferStopsUsedInTrips(groupByTransport.car, tripRequest);

        // Make OTP requests to fetch the public transport trips for each transfer stop
        const returnTripPromises = transferStopsUsedInTrips.map((trip) => getPublicTransportTrip(tripRequest.destination, trip.coords,
            tripRequest.preferences.comingBack!.returnDateTime, tripRequest.preferences.modeOfTransport, 5)
        )
        // For each transfer stop have a few trip patterns
        const tripPatternsForTransferStops: OTPTripPattern[][] = (await Promise.all(returnTripPromises)).map((trip) => trip.trip.tripPatterns)

        setDestinationNamesForPublicTransportTrips(tripPatternsForTransferStops, transferStopsUsedInTrips)

        // Convert all the trip patterns to TripResult type
        const tripResultsForTransferStops = await Promise.all(tripPatternsForTransferStops.map(async (tripPatternsForStop) => {
            const tripPatternsTransferStopPromises = tripPatternsForStop.map(convertOTPDataToTripResult)
            return await Promise.all(tripPatternsTransferStopPromises)
        }))
        const carTripsResponses = await processCarTrips(transferStopsUsedInTrips, tripResultsForTransferStops, tripRequest);

        const tripResultsForTransferStopsFlatten = tripResultsForTransferStops.flat()
        for (let i = 0; i < carTripsResponses.length; i++) {
            carTrips.push(mergeFinalTripWithCar(tripResultsForTransferStopsFlatten[i], carTripsResponses[i], true))
        }
    }

    return [...carTrips, ...publicTransportTrips]
}

export { fetchReturnTrips }
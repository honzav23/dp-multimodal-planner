/**
 * @file transportRoutesWithDelays.ts
 * @brief This file enriches trip legs with accurate routes and delays
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type {OTPTripLeg} from "./types/OTPGraphQLData.ts";
import {calculateDistance} from "./common/common.ts";
import { lissyInfo } from "./api.ts";
import {getDelaysFromLissy, getShapesFromLissy} from "./common/lissyApi.ts";
import type { LissyAvailableTrip } from "./types/LissyTypes.ts";
import polyline from "polyline-codec";
import {DelayInfo, DelaysForLeg} from "../types/TripResult.ts";
import { KordisWebSocketManager } from "./common/realtimeVehicleInfoProcessing.ts";
import {RealtimeVehicleInfo} from "./types/RealtimeVehicleInfo.ts";

/**
 * Calculate the total distance of a line given that the points form a line
 * @param coords The array of points (a line)
 * @returns The total distance
 */
function calculateTotalDistance(coords: [number, number][]): number {
    let distance = 0
    for (let i = 0; i < coords.length - 1; i++) {
        distance += calculateDistance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    }
    return distance
}

/**
 * Find corresponding trips which match the start stop and end stop
 * @param lineStartStop Stop from which the line begins
 * @param lineEndStop Stop in which the line ends
 */
function findCorrespondingTrips(lineStartStop: string, lineEndStop: string) {
    for (const line of lissyInfo.availableTripsByLines) {
        const correspondingTrips = line.filter((trip) => trip.stops === `${lineStartStop} -> ${lineEndStop}`)
        if (correspondingTrips.length > 0) {
            return correspondingTrips
        }
    }
    return []
}

function findCorrectTripFromCorrespondingTrips(correspondingTrips: LissyAvailableTrip[], leg: OTPTripLeg): LissyAvailableTrip | null {
    for (const trip of correspondingTrips) {
        if (trip.stopOrder.length === leg.serviceJourney!.quays.length) {
            let stopsMatch = true
            for (let i = 0; i < trip.stopOrder.length; i++) {
                if (trip.stopOrder[i] !== leg.serviceJourney!.quays[i].name) {
                    stopsMatch = false
                    break
                }
            }
            if (stopsMatch) {
                return trip
            }
        }
    }
    return null
}

function findStopIndices(leg: OTPTripLeg, vehicleInfoOnCurrentLeg: RealtimeVehicleInfo): [number, number] {
    const fromStopId = leg.fromPlace.quay!.id
    const fromStopIndex = leg.serviceJourney!.quays.findIndex((q) => q.id === fromStopId)

    const gtfsStopIdRegex = /1:U(\d{4})([a-zA-Z]\d*)/
    const lastVehicleStopIndex = leg.serviceJourney!.quays.findIndex((q) => {
        const match = q.id.match(gtfsStopIdRegex)
        if (!match) {
            return false
        }
        return match[1] === vehicleInfoOnCurrentLeg.attributes.laststopid.toString()
    })

    return [fromStopIndex, lastVehicleStopIndex]
}

function getVehicleInfoOnCurrentLeg(leg: OTPTripLeg): RealtimeVehicleInfo | undefined {
    const numericGtfsTripId = parseInt(leg.serviceJourney!.id!.split(':')[1]) // OTP GTFS trip id is in the format '1:123456'
    const kordisManager = KordisWebSocketManager.getInstance()
    const tripIdToVehicleInfo = kordisManager.getTripIdToVehicleInfo()
    return tripIdToVehicleInfo[numericGtfsTripId]
}

// Gets the delay that the leg has AT THE MOMENT
// if the trip or the delay is not found, null is returned
function getCurrentLegDelay(leg: OTPTripLeg): number | null {
    if (!leg.serviceJourney!.id) {
        return null
    }
    const vehicleInfoOnCurrentLeg = getVehicleInfoOnCurrentLeg(leg)
    if (!vehicleInfoOnCurrentLeg) {
        return null
    }
    if (vehicleInfoOnCurrentLeg.attributes.isinactive === "true") {
        return null
    }

    const [fromStopIndex, lastVehicleStopIndex] = findStopIndices(leg, vehicleInfoOnCurrentLeg)

    if (fromStopIndex === -1 || lastVehicleStopIndex === -1) {
        return null
    }

    const vehicleNotArrived = lastVehicleStopIndex < fromStopIndex
    if (vehicleNotArrived) {
        return vehicleInfoOnCurrentLeg.attributes.delay
    }
    return null

}
/**
 * Gets the delay information for a leg
 * @param tripId Id of the trip the delay should be fetched for
 * @param endingStopIndex Index of the end stop in a leg so that delays for further stops are not fetched
 * 
 * @returns Promise of the delay information
 */
async function getPastDelaysForLeg(tripId: number, endingStopIndex: number): Promise<DelayInfo[]> {
    const delayData = await getDelaysFromLissy(tripId, lissyInfo.availableDates)
    const pastDelays: DelayInfo[] = []
    if (delayData) {
        for (const dateKey of Object.keys(delayData)) {
            const endSegmentDelay = findNearestDelay(delayData[dateKey], endingStopIndex)

            // Need to find the delay closest to the end stop
            const maxKey = Math.max(...Object.keys(endSegmentDelay).map(Number))
            pastDelays.push({ delayDate: dateKey, delay: endSegmentDelay[maxKey.toString()] })
        }
    }
    if (pastDelays.length > 0) {
        pastDelays.sort((a: DelayInfo, b: DelayInfo) => {
           return new Date(a.delayDate).valueOf() - new Date(b.delayDate).valueOf()
        });
    }
    return pastDelays
}

/**
 * Looks for the nearest delay info for given stop when info for a given stop
 * is not available
 * @param delaysForTrip All delays for different stop segments on a trip
 * @param endingStopIndex Index of a stop for which delay is needed
 * @returns The nearest delay information
 */
function findNearestDelay(delaysForTrip: Record<string, any>, endingStopIndex: number): Record<string, number> {
    const possibleDelay = delaysForTrip[(endingStopIndex - 1).toString()]
    let nearestDelay = null
    let minDistance = Infinity

    // Didn't find the delay for ending stop so find the delay for the nearest stop
    // before the end stop
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
        if (nearestDelay === null) {
            return {"0": 0}
        }
        return nearestDelay
    }
    return possibleDelay
}

async function getLegDelays(leg: OTPTripLeg, validCorrespondingTrip: LissyAvailableTrip | null): Promise<DelaysForLeg> {
    const legDelays: DelaysForLeg = {
        averageDelay: 0,
        pastDelays: [],
        currentDelay: -1
    };

    // Get current delay if available
    const currentLegDelay = getCurrentLegDelay(leg);
    if (currentLegDelay !== null) {
        legDelays.currentDelay = currentLegDelay;
    }

    if (validCorrespondingTrip === null) {
        return legDelays;
    }

    const firstStopTimeOfDeparture = leg.serviceJourney!.passingTimes[0].departure.time;
    const correctTimeTrip = validCorrespondingTrip.trips.find((t) => t.dep_time === firstStopTimeOfDeparture);

    if (!correctTimeTrip) {
        return legDelays;
    }

    const endingStopIndex = leg.serviceJourney!.quays.findIndex((quay) => quay.id === leg.toPlace.quay!.id);
    if (endingStopIndex !== -1) {
        legDelays.pastDelays = await getPastDelaysForLeg(correctTimeTrip.id, endingStopIndex);
        if (legDelays.pastDelays.length > 0) {
            legDelays.averageDelay = Math.round(legDelays.pastDelays.reduce((sum, delay) => sum + delay.delay, 0) / legDelays.pastDelays.length);
        }
    }

    return legDelays;
}

async function getLegRoute(leg: OTPTripLeg, validCorrespondingTrip: LissyAvailableTrip | null): Promise<{ route: string, distance: number }> {
    let routePolyline = leg.pointsOnLink.points;
    let routeDistance = leg.distance;

    if (validCorrespondingTrip === null) {
        return { route: routePolyline, distance: routeDistance };
    }

    const tripShape = await getShapesFromLissy(validCorrespondingTrip.shape_id);
    if (tripShape === null) {
        return { route: routePolyline, distance: routeDistance };
    }

    const beginningStopIndex = leg.serviceJourney!.quays.findIndex((quay) => quay.id === leg.fromPlace.quay!.id);
    const endingStopIndex = leg.serviceJourney!.quays.findIndex((quay) => quay.id === leg.toPlace.quay!.id);

    if (beginningStopIndex === -1 || endingStopIndex === -1) {
        return { route: routePolyline, distance: routeDistance };
    }
    const routeCoordsSlice = tripShape.coords.slice(beginningStopIndex, endingStopIndex);
    const routeCoordsFlatten = routeCoordsSlice.flat();
    const calculatedDistance = calculateTotalDistance(routeCoordsFlatten);

    if (calculatedDistance > 0) {
        routePolyline = polyline.encode(routeCoordsFlatten, 5);
        routeDistance = calculatedDistance;
    }

    return { route: routePolyline, distance: routeDistance };
}

export { calculateTotalDistance, findCorrespondingTrips, findCorrectTripFromCorrespondingTrips,
         getLegRoute, getLegDelays}
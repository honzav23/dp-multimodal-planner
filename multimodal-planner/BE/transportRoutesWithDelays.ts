/**
 * @file transportRoutesWithDelays.ts
 * @brief This file enriches trip legs with accurate routes and delays
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type { OTPTripPattern} from "./types/OTPGraphQLData.ts";
import {calculateDistance} from "./common/common.ts";
import { availableTripsByLines, availableDates } from "./api.ts";
import {getDelaysFromLissy, getShapesFromLissy} from "./common/lissyApi.ts";
import type { LissyAvailableTrip } from "./types/LissyTypes.ts";
import polyline from 'polyline'
import {DelayInfo} from "../types/TripResult.ts";

/**
 * Calculate the total distance of a line given that the points form a line
 * @param coords The array of points (a line)
 * @returns The total distance
 */
export function getTotalDistance(coords: [number, number][]): number {
    let distance = 0
    for (let i = 0; i < coords.length - 1; i++) {
        distance += calculateDistance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    }
    return distance
}

/**
 * Find corresponding trips which match the start stop and end stop
 * @param lineFrom Stop from which the line begins
 * @param lineTo Stop in which the line ends
 */
function findCorrespondingTrips(lineFrom: string, lineTo: string) {
    for (const line of availableTripsByLines) {
        const correspondingTrips = line.filter((trip) => trip.stops === `${lineFrom} -> ${lineTo}`)
        if (correspondingTrips.length > 0) {
            return correspondingTrips
        }
    }
    return []
}

/**
 * Gets the delay information for a leg
 * @param tripId Id of the trip the delay should be fetched for
 * @param endingStopIndex Index of the end stop in a leg so that delays for further stops are not fetched
 *
 * @returns Promise of the delay information
 */
async function getDelaysForLeg(tripId: number, endingStopIndex: number): Promise<DelayInfo[]> {
    const delayData = await getDelaysFromLissy(tripId, availableDates)
    const delayInfo: DelayInfo[] = []
    if (delayData) {
        for (const dateKey of Object.keys(delayData)) {
            const endSegmentDelay = findNearestDelay(delayData[dateKey], endingStopIndex)

            // Need to find the delay closest to the end stop
            const maxKey = Math.max(...Object.keys(endSegmentDelay).map(Number))
            delayInfo.push({ delayDate: dateKey, delay: endSegmentDelay[maxKey.toString()] })
        }
    }
    if (delayInfo.length > 0) {
        delayInfo.sort((a: DelayInfo, b: DelayInfo) => {
           return new Date(a.delayDate).valueOf() - new Date(b.delayDate).valueOf()
        });
    }
    return delayInfo
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

/**
 * Gets the routes and delays for trip legs inside of a trip
 * @param trip Trip to get the information about
 *
 * @returns An object for each trip leg containing information about the route, total distance and delay information
 */
export async function getLegsRoutesAndDelays(trip: OTPTripPattern) {
    const legRoutes: {route: string, distance: number, delayInfo: DelayInfo[]}[] = []
    for (const leg of trip.legs) {
        let legDelays: DelayInfo[] = []

        // Skip car and foot (route automatic, no delay) and the case wheren no trips are available
        if (leg.mode === 'car' || leg.mode === 'foot' || availableTripsByLines.length === 0) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delayInfo: legDelays})
            continue
        }
        const lineFrom = leg.serviceJourney.quays[0].name
        const lineTo = leg.serviceJourney.quays[leg.serviceJourney.quays.length - 1].name

        const correspondingTrips = findCorrespondingTrips(lineFrom, lineTo)

        if (correspondingTrips.length === 0) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delayInfo: legDelays})
            continue
        }

        let validCorrespondingTrip: LissyAvailableTrip = {shape_id: -1, stops: '', trips: [], stopOrder: []}

        // Find the correct trip based on the stops they include
        for (const trip of correspondingTrips) {
            if (trip.stopOrder.length === leg.serviceJourney.quays.length) {
                let stopsMatch = true
                for (let i = 0; i < trip.stopOrder.length; i++) {
                    if (trip.stopOrder[i] !== leg.serviceJourney.quays[i].name) {
                        stopsMatch = false
                        break
                    }
                }
                if (stopsMatch) {
                    validCorrespondingTrip = trip
                    break
                }
            }
        }
        if (validCorrespondingTrip.shape_id === -1) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delayInfo: legDelays})
            continue
        }
        const tripShape = await getShapesFromLissy(validCorrespondingTrip.shape_id)
        if (tripShape === null) {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delayInfo: legDelays})
            continue
        }

        const beginningStopIndex = leg.serviceJourney.quays.findIndex((quay) => quay.id === leg.fromPlace.quay.id)
        const endingStopIndex = leg.serviceJourney.quays.findIndex((quay) => quay.id === leg.toPlace.quay.id)

        const firstStopTimeOfDeparture = leg.serviceJourney.passingTimes[0].departure.time
        if (Object.keys(validCorrespondingTrip).length > 0) {

            // Find a trip with the correct departure time
            const foundTrip = validCorrespondingTrip.trips.find((t) => t.dep_time === firstStopTimeOfDeparture)
            if (foundTrip) {
                legDelays = await getDelaysForLeg(foundTrip.id, endingStopIndex)
            }
            else {
               // console.log("not found")
            }
            if (beginningStopIndex === -1 || endingStopIndex === -1) {
                legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delayInfo: legDelays})
                continue
            }
            // Flatten the array of coords so the total distance can be calculated easily
            const routeCoordsFlatten = tripShape.coords.slice(beginningStopIndex, endingStopIndex).flat()
            const distance = getTotalDistance(routeCoordsFlatten)

            if (distance === 0) {
                legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delayInfo: legDelays})
            }
            else {
                legRoutes.push({route: polyline.encode(routeCoordsFlatten), distance: distance, delayInfo: legDelays})
            }
        }
        else {
            legRoutes.push({route: leg.pointsOnLink.points, distance: leg.distance, delayInfo: legDelays})
        }

    }
    return legRoutes;
}
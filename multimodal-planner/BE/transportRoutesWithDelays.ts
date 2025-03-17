import type {OTPTripLeg, OTPTripPattern} from "./types/OTPGraphQLData.ts";
import {calculateDistance} from "./common/common.ts";
import { availableTripsByLines, availableDates } from "./api.ts";
import polyline from 'polyline'
import {DelayInfo} from "../types/TripResult.ts";

export function getTotalDistance(coords: [number, number][]): number {
    let distance = 0
    for (let i = 0; i < coords.length - 1; i++) {
        distance += calculateDistance(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    }
    return distance
}

export function convertStringTimeToUnix(tripLeg: OTPTripLeg): number {
    const [hours, minutes] = tripLeg.serviceJourney.passingTimes[0].departure.time.split(":").map(Number)
    const date = new Date(1970, 0, 1, hours, minutes)
    return date.valueOf()
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

async function fetchShapes(correspondingTrips: any[]) {
    const requests = correspondingTrips.map((trip) =>
        fetch(`${Deno.env.get("LISSY_API_URL")}/shapes/getShape?shape_id=${trip.shape_id}`, {
            method: "GET",
            headers: { "Authorization": Deno.env.get("LISSY_API_KEY") }
        })
    )
    const responses = await Promise.all(requests)
    return Promise.all(responses.map((res) => res.json()))
}

async function getDelaysForLeg(tripId: number, endingStopIndex: number): Promise<DelayInfo[]> {
    const response = await fetch(`${Deno.env.get('LISSY_API_URL')}/delayTrips/getTripData?dates=[[${availableDates[0]},${availableDates[1]}]]&trip_id=${tripId}`, {
        method: "GET",
        headers: { "Authorization": Deno.env.get("LISSY_API_KEY") }
    })
    const data = await response.json()
    const delayInfo: DelayInfo[] = []
    if (Object.keys(data).length > 0) {
        for (const key of Object.keys(data)) {
            console.log(key)
            const endSegmentDelay = findNearestDelay(data[key.toString()], endingStopIndex)
            const maxKey = Math.max(...Object.keys(endSegmentDelay).map(Number))
            delayInfo.push({ delayDate: parseInt(key), delay: endSegmentDelay[maxKey.toString()] })
        }
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
function findNearestDelay(delaysForTrip: Record<string, any>, endingStopIndex: number): string {
    const possibleDelay = delaysForTrip[(endingStopIndex - 1).toString()]
    let nearestDelay = null
    let minDistance = Infinity

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
        return nearestDelay
    }
    return possibleDelay
}

export async function getLegsRoutesAndDelays(trip: OTPTripPattern) {
    const legRoutes: {route: string, distance: number, delayInfo: DelayInfo[]}[] = []
    for (const leg of trip.legs) {
        let legDelays: DelayInfo[] = []

        // Skip car and foot (route automatic, no delay)
        if (leg.mode === 'car' || leg.mode === 'foot') {
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
        const tripJsons = await fetchShapes(correspondingTrips)

        let validTripRoute = {}
        let validCorrespondingTrip = {}

        // Find the correct trip based on the total number of stops they include
        for (let i = 0; i < tripJsons.length; i++) {
            if (tripJsons[i].stops.length === leg.serviceJourney.quays.length) {
                validTripRoute = tripJsons[i]
                validCorrespondingTrip = correspondingTrips[i]
                break
            }
        }

        const routeCoords = validTripRoute.coords as [number, number][][]
        const beginningStopIndex = leg.serviceJourney.quays.findIndex((quay) => quay.id === leg.fromPlace.quay.id)
        const endingStopIndex = leg.serviceJourney.quays.findIndex((quay) => quay.id === leg.toPlace.quay.id)

        const firstStopTimeOfDeparture = convertStringTimeToUnix(leg)
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
            const routeCoordsFlatten = routeCoords.slice(beginningStopIndex, endingStopIndex).flat()
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
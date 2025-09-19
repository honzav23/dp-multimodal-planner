/**
 * @file lissyApi.ts
 * @brief File that contains all functions that call the API from Lissy app
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type {
    LissyAvailableDates,
    LissyAvailableRoute,
    LissyAvailableTrip,
    LissyDelay,
    LissyShape
} from "../types/LissyTypes.ts";

function getHeaders() {
    const apiKey = Deno.env.get("LISSY_API_KEY")
    return new Headers({
        "Authorization": apiKey!
    })
}

/**
 * Get all dates when the delay information is available
 */
async function getAvailableDatesFromLissy(): Promise<LissyAvailableDates | null> {
    try {
        const dateResponse = await fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/availableDates`, {
            method: "GET",
            headers: getHeaders()
        })
        if (!dateResponse.ok) {
            return null
        }
        const dateResponseJson = await dateResponse.json()
        return dateResponseJson
    }
    catch {
        return null
    }
}

/**
 * For given date range get all routes (lines) for which the delay data is available
 * @param startDate Beginning of the range in YYYY-MM-DD format
 * @param endDate The end of range in YYYY-MM-DD format
 */
async function getAvailableRoutesForDates(startDate: string, endDate: string): Promise<LissyAvailableRoute[] | null> {
    try {
        const availableRoutesResponse = await fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/getAvailableRoutes?dates=[["${startDate}","${endDate}"]]`, {
            method: "GET",
            headers: getHeaders()
        })
        if (!availableRoutesResponse.ok) {
            return null
        }
        const availableRoutesJson = await availableRoutesResponse.json()
        if (Object.keys(availableRoutesJson).length === 0) {
            return null
        }
        return availableRoutesJson
    }
    catch {
        return null
    }
}

async function getAvailableTripsForRoutes(availableRoutes: LissyAvailableRoute[], startDate: string, endDate: string): Promise<LissyAvailableTrip[][] | null> {
    try {
        const availableTripsFetches = availableRoutes.map((ar) => {
            return fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/getAvailableTrips?dates=[["${startDate}","${endDate}"]]&route_id=${ar.id}&fullStopOrder=true`, {
                method: "GET",
                headers: getHeaders()
            })
        })
        const availableTripsResponses = await Promise.all(availableTripsFetches)
        const availableTripsJson = await Promise.all(availableTripsResponses.map((a) => a.json()))

        return availableTripsJson
    }
    catch {
        return null
    }
}

/**
 * Get delays for a given trip and given date range
 * @param tripId Id of a trip to get delay about
 * @param availableDates Range of dates for which the delays are considered
 */
async function getDelaysFromLissy(tripId: number, availableDates: string[]): Promise<LissyDelay | null> {
    const response = await fetch(`${Deno.env.get('LISSY_API_URL')}/delayTrips/getTripData?dates=[["${availableDates[0]}","${availableDates[1]}"]]&trip_id=${tripId}`, {
        method: "GET",
        headers: getHeaders()
    })
    if (!response.ok) {
        return null
    }
    const delayData = await response.json()
    if (Object.keys(delayData).length === 0) {
        return null
    }
    return delayData
}

/**
 * Gets the shape for a given shapeId
 * @param shapeId Identifier of a shape
 */
async function getShapesFromLissy(shapeId: number): Promise<LissyShape | null>  {
    const shapeResponse = await fetch(`${Deno.env.get("LISSY_API_URL")}/shapes/getShape?shape_id=${shapeId}`, {
        method: "GET",
        headers: getHeaders()
    })
    if (!shapeResponse.ok) {
        return null
    }

    const shapeJson = await shapeResponse.json()
    return shapeJson
}

export { getShapesFromLissy, getDelaysFromLissy, getAvailableTripsForRoutes, getAvailableRoutesForDates,
         getAvailableDatesFromLissy }
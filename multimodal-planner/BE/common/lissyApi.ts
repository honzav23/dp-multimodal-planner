/**
 * @file lissyApi.ts
 * @brief File that contains all functions that call the API from Lissy app
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import {AvailableTrip} from "../types/AvailableTrip.ts";

function getHeaders() {
    return { "Authorization": Deno.env.get("LISSY_API_KEY") }
}

/**
 * Get all dates when the delay information is available
 */
export async function getAvailableDatesFromLissy() {
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

/**
 * For given date range get all routes (lines) for which the delay data is available
 * @param startDate Beginning of the range in YYYY-MM-DD format
 * @param endDate The end of range in YYYY-MM-DD format
 */
export async function getAvailableRoutesForDates(startDate: string, endDate: string) {
    const availableRoutesResponse = await fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/getAvailableRoutes?dates=[["${startDate}","${endDate}"]]`, {
        method: "GET",
        headers: getHeaders()
    })
    if (!availableRoutesResponse.ok) {
        return null
    }
    const availableRoutesJson = await availableRoutesResponse.json() as { route_short_name: string, id: number }[]
    if (Object.keys(availableRoutesJson).length === 0) {
        return null
    }
    return availableRoutesJson
}

export async function getAvailableTripsForRoutes(availableRoutes: { route_short_name: string, id: number }[], startDate: string, endDate: string) {
    const availableTripsFetches = availableRoutes.map((ar) => {
        return fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/getAvailableTrips?dates=[["${startDate}","${endDate}"]]&route_id=${ar.id}`, {
            method: "GET",
            headers: getHeaders()
        })
    })
    const availableTripsResponses = await Promise.all(availableTripsFetches)
    const availableTripsJson = await Promise.all(availableTripsResponses.map((a) => a.json())) as AvailableTrip[][]

    return availableTripsJson
}

/**
 * Get delays for a given trip and given date range
 * @param tripId Id of a trip to get delay about
 * @param availableDates Range of dates for which the delays are considered
 */
export async function getDelaysFromLissy(tripId: number, availableDates: string[]) {
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
 * Gets the shapes (paths) from Lissy to all trips
 * @param trips Trips to get the shapes for
 */
export async function getShapesFromLissy(trips: any[]) {
    const requests = trips.map((trip) =>
        fetch(`${Deno.env.get("LISSY_API_URL")}/shapes/getShape?shape_id=${trip.shape_id}`, {
            method: "GET",
            headers: getHeaders()
        })
    )
    const responses = await Promise.all(requests)
    return Promise.all(responses.map((res) => res.json()))
}
/**
 * @file common.ts
 * @brief File that contains all functions that are not relevant to other files in the backend
 * part
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {getAvailableDatesFromLissy, getAvailableRoutesForDates, getAvailableTripsForRoutes} from "./lissyApi.ts";
import type { LissyObj } from "../types/LissyTypes.ts";
import { parseArgs } from "args";
import {TripRequest} from "../../types/TripRequest.ts";

function parseArguments(): boolean {
    const flags = parseArgs(Deno.args, {
        boolean: ["external-gtfs"],
    })
    return !!flags["external-gtfs"]
}

/**
 * Go daysInHistory days in history from baseDate
 * @param baseDate Base date in YYYY-MM-DD format
 * @param daysInHistory How many days to go back
 *
 * @returns Calculated date in YYYY-MM-DD format
 */
function goToHistory(baseDate: string, daysInHistory: number) {
    const dateFromString = new Date(baseDate)
    dateFromString.setMonth(dateFromString.getMonth() + 1)
    dateFromString.setDate(dateFromString.getDate() - daysInHistory)

    return `${dateFromString.getFullYear()}-${dateFromString.getMonth()}-${dateFromString.getDate()}`
}

/**
 * Get all trips from Lissy app which have delay information from the last 2 days
 * @returns Promise of all available trips and dates
 */
async function getTripsForLines(): Promise<LissyObj> {

    const externalGTFS = parseArguments()
    if (externalGTFS) {
        return {availableTripsByLines: [], availableDates: []}
    }

    const availableDates = await getAvailableDatesFromLissy()
    if (!availableDates) {
        return {availableTripsByLines: [], availableDates: []}
    }
    const endDate = availableDates.end
    const startDate = goToHistory(endDate, 2)


    const availableRoutes = await getAvailableRoutesForDates(startDate, endDate)
    if (!availableRoutes) {
        return {availableTripsByLines: [], availableDates: []}
    }

    const availableTrips = await getAvailableTripsForRoutes(availableRoutes, startDate, endDate)
    if (!availableTrips) {
        return {availableTripsByLines: [], availableDates: []}
    }
    return {availableTripsByLines: availableTrips, availableDates: [startDate, endDate]}
}

/**
 * Calculates the distance between two points on the Earth's surface.
 * 
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * 
 * @returns The distance between the two points in meters
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

    return distance * 1000;
}

function addSeconds(isoDate: string, seconds: number): string {
    const date = new Date(isoDate)
    date.setSeconds(date.getSeconds() + seconds)

    return date.toISOString()
}

// Correct the date times of the trip request by
// converting them to 24-hour format
function correctDateTimes(tripRequest: TripRequest) {
    const [tripDate, tripTime] = tripRequest.departureDateTime.split("T");
    const updatedTime = convert12HourTo24Hour(tripTime);
    tripRequest.departureDateTime = `${tripDate}T${updatedTime}`;
    if (tripRequest.preferences.comingBack) {
        const [comingBackDate, comingBackTime] = tripRequest.preferences.comingBack.returnDateTime.split("T");
        const updatedComingBackTime = convert12HourTo24Hour(comingBackTime);
        tripRequest.preferences.comingBack.returnDateTime = `${comingBackDate}T${updatedComingBackTime}`;
    }
}

/**
 * Converts time from 12-hour format to 24-hour format
 * Created with the help of ChatGPT
 * @param time Time to convert
 * @returns Time in 24-hour format
 */
function convert12HourTo24Hour(time: string): string {
    const [splitTime, modifier] = time.split(" ")
    
    if (modifier) {
        const [hours, mins, secs] = splitTime.split(":")
        let hoursInt = parseInt(hours)
        if (modifier === "PM" && hours !== "12") {
            hoursInt += 12
        }
        else if (modifier === "AM" && hours === "12") {
            hoursInt = 0
        }
        const formattedHours = hoursInt.toString().padStart(2, '0')
        return `${formattedHours}:${mins}:${secs}`
    }
    return time
}

export { parseArguments, correctDateTimes, addSeconds, calculateDistance, getTripsForLines }
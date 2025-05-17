/**
 * @file common.ts
 * @brief File that contains all functions that are not relevant to other files in the backend
 * part
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {parse} from "@std/csv"
import type {TransferStop} from "../../types/TransferStop.ts";
import {gql, request} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import type {OTPGraphQLData} from "../types/OTPGraphQLData.ts";
import type { TransportMode } from '../../types/TransportMode.ts'
import {getAvailableDatesFromLissy, getAvailableRoutesForDates, getAvailableTripsForRoutes} from "./lissyApi.ts";
import {LissyAvailableTrip} from "../types/LissyTypes.ts";
import { rootDir } from "../api.ts";
import { parseArgs } from "args";

function parseArguments(): boolean {
    const flags = parseArgs(Deno.args, {
        boolean: ["external-gtfs"],
    })
    return !!flags["external-gtfs"]
}

/**
 * Gets available transfer stops from .csv file
 * @returns Promise of all transfer stops
 */
export async function getTransferStops(): Promise<TransferStop[]> {
    const text = Deno.readTextFileSync(`${rootDir}/transferStops/transferStopsWithParkingLots.csv`);
    const csvData = parse(text, {skipFirstRow: true, separator: ';', strip: true});

    const variables = {
        ids: csvData.map((row) => `1:${row.stop_id}`)
    }
    const query = gql`
        query quays($ids: [String]) {
            quays(ids: $ids) {
                stopPlace {
                    id,
                    name,
                    latitude,
                    longitude
                }
            }
        }
    `;
    const otpUrl = Deno.env.get('OTP_URL')
    
    if (!otpUrl) {
        return []
    }
    const data = await request(otpUrl, query, variables)

    const transferPoints: TransferStop[] = []

    // Combine data from CSV and OTP to make an array of transfer stops
    for (let i = 0; i < csvData.length; i++) {
        const transferStop: TransferStop = {
            stopId: data.quays[i]?.stopPlace?.id ?? csvData[i].stop_id,
            stopName: data.quays[i]?.stopPlace?.name ?? csvData[i].stop_name,
            stopCoords: [data.quays[i]?.stopPlace?.latitude ?? parseFloat(csvData[i].stop_lat),
                data.quays[i]?.stopPlace?.longitude ?? parseFloat(csvData[i].stop_lon)],
            hasParking: csvData[i].has_parking === "1",
        }
        transferPoints.push(transferStop)
    }
    return transferPoints;
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
export async function getTripsForLines(): Promise<{availableTripsByLines: LissyAvailableTrip[][], availableDates: string[]}> {

    const externalGTFS = parseArguments()
    if (externalGTFS) {
        return {availableTripsByLines: [], availableDates: []}
    }

    const availableDates = await getAvailableDatesFromLissy()
    if (!availableDates) {
        return {availableTripsByLines: [], availableDates: []}
    }
    const endDate = availableDates.end
    const startDate = goToHistory(endDate, 1)


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
 * Returns the string that is used in GraphQL queries to get trips based on some variables
 * @returns GraphQL string
 */
function getGqlQueryString(): string {
    return gql`
        query trip($from: Location!, $to: Location!, $numTripPatterns: Int, $dateTime: DateTime, $modes: Modes, $pageCursor: String) {
          trip(
            from: $from
            to: $to
            numTripPatterns: $numTripPatterns
            dateTime: $dateTime
            modes: $modes
            pageCursor: $pageCursor
          ) 
          {
            nextPageCursor
            tripPatterns {
              aimedStartTime
              aimedEndTime
              distance
              duration
              legs {
                mode
                aimedStartTime
                aimedEndTime
                distance
                serviceJourney {
                    quays {
                        name
                        id
                    }
                    passingTimes {
                        departure {
                            time
                        }
                    }
                }
                fromPlace {
                  name
                  quay {
                    id
                  }
                }
                toPlace {
                    name
                    latitude
                    longitude
                    quay {
                        id
                    }
                }
                line {
                    publicCode
                }
                pointsOnLink {
                  points
                }
              }
            }
          }
        }
    `
}

/**
 * Returns the route from OTP if car was used
 * @param from 
 * @param to
 * @param dateTime Date and time of departure (in ISO format)
 */
export async function getRouteByCar(from: [number, number], to: [number, number], dateTime: string): Promise<OTPGraphQLData> {
    const query = getGqlQueryString()
    const variables = {
        from: {
            coordinates: {
                latitude: from[0],
                longitude: from[1]
            }
        },
        to: {
            coordinates: {
                latitude: to[0],
                longitude: to[1]
            }
        },
        dateTime,
        modes: {
            directMode: "car"
        }
    }
    const otpUrl = Deno.env.get('OTP_URL')
    
    if (!otpUrl) {
        return {
            trip: {
                nextPageCursor: null,
                tripPatterns: []
            }
        }
    }
    const carRoute = await request(otpUrl, query, variables) as OTPGraphQLData
    return carRoute
}

/**
 * Returns the route from OTP if public transport was used
 * @param from 
 * @param to 
 * @param dateTime Date and time of departure (in ISO format)
 * @param transport Modes of transport used along the way (empty array means)
 * all means of transport
 * @returns Promise of the result from OTP
 */
export async function getPublicTransportTrip(from: [number, number], to: [number, number], dateTime: string, transport: TransportMode[], numTripPatterns: number): Promise<OTPGraphQLData> {
    const query = getGqlQueryString()
    const variables: Record<string, any> = {
        from: {
            coordinates: {
                latitude: from[0],
                longitude: from[1]
            }
        },
        to: {
            coordinates: {
                latitude: to[0],
                longitude: to[1]
            }
        },
        dateTime,
        modes: {
            accessMode: "flexible",
            egressMode: "flexible",
        },
        numTripPatterns
    }

    if (transport.length > 0) {
        const modes = []
        for (const t of transport) {
            modes.push({transportMode: t})
        }
        variables.modes.transportModes = modes
    }

    const otpUrl = Deno.env.get('OTP_URL')
    
    if (!otpUrl) {
        return {
            trip: {
                nextPageCursor: null,
                tripPatterns: []
            }
        }
    }
    let publicTransportRoute = await request(otpUrl, query, variables) as OTPGraphQLData
    if (publicTransportRoute.trip.tripPatterns.length === 0) {
        variables.pageCursor = publicTransportRoute.trip.nextPageCursor
        publicTransportRoute = await request(otpUrl, query, variables)
    }
    return publicTransportRoute
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
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export function addMinutes(isoDate: string, minutes: number): string {
    const date = new Date(isoDate)
    date.setMinutes(date.getMinutes() + minutes)

    return date.toISOString()
}

/**
 * Converts time from 12-hour format to 24-hour format
 * Created with the help of ChatGPT
 * @param time Time to convert
 * @returns Time in 24-hour format
 */
export function convert12HourTo24Hour(time: string): string {
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
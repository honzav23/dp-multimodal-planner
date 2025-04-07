/**
 * @file common.ts
 * @brief File that contains all functions that are not relevant to other files in the backend
 * part
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import {parse} from "@std/csv"
import type {TransferStop} from "../../types/TransferStop.ts";
import {gql, request} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import type {OTPGraphQLData} from "../types/OTPGraphQLData.ts";
import type { TransportMode } from '../../types/TransportMode.ts'
import { AvailableTrip } from "../types/AvailableTrip.ts";
import {getAvailableDatesFromLissy, getAvailableRoutesForDates, getAvailableTripsForRoutes} from "./lissyApi.ts";

/**
 * Gets available transfer stops from .csv file
 * @returns Promise of all transfer stops
 */
export async function getTransferStops(): Promise<TransferStop[]> {
    const text = Deno.readTextFileSync('./transferStops/transferStopsWithParkingLots.csv');
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
    const data = await request(Deno.env.get("OTP_URL"), query, variables)

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
export async function getTripsForLines(): Promise<{availableTripsByLines: AvailableTrip[][], availableDates: string[]}> {

    const availableDates = await getAvailableDatesFromLissy()
    if (!availableDates) {
        return {availableTripsByLines: [], availableDates: []}
    }
    const endDate = availableDates.end
    const startDate = goToHistory(endDate, 0)


    const availableRoutes = await getAvailableRoutesForDates(startDate, endDate)
    if (!availableRoutes) {
        return {availableTripsByLines: [], availableDates: []}
    }

    const availableTrips = await getAvailableTripsForRoutes(availableRoutes, startDate, endDate)
    return {availableTripsByLines: availableTrips, availableDates: [startDate, endDate]}
}

/**
 * Returns the string that is used in GraphQL queries to get trips based on some variables
 * @returns GraphQL string
 */
function getGqlQueryString(): string {
    return gql`
        query trip($from: Location!, $to: Location!, $numTripPatterns: Int, $arriveBy: Boolean, $dateTime: DateTime, $modes: Modes) {
          trip(
            from: $from
            to: $to
            numTripPatterns: $numTripPatterns
            arriveBy: $arriveBy
            dateTime: $dateTime
            modes: $modes
          ) {
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
    const carRoute = await request(Deno.env.get("OTP_URL"), query, variables)
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
    const publicTransportRoute = await request(Deno.env.get("OTP_URL"), query, variables)
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
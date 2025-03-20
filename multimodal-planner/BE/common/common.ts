import {parse, stringify} from "@std/csv"
import type {TransferStop, TransferStopCluster} from "../../types/TransferStop";
import {gql, request} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import type {OTPGraphQLData, OTPTripLeg} from "../types/OTPGraphQLData";
import type { TransportMode } from '../../types/TransportMode'
import { AvailableTrip } from "../types/AvailableTrip.ts";

export async function getTransferStops(): Promise<TransferStop[]> {
    const text = Deno.readTextFileSync('./transferStops/transferPointsWithParkingLots.csv');
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

    // The data from OTP are returned in order so this can be done
    for (let i = 0; i < csvData.length; i++) {
        const transferStop: TransferStop = {
            stopId: data.quays[i]?.stopPlace.id ?? csvData[i].stop_id,
            stopName: data.quays[i]?.stopPlace.name ?? csvData[i].stop_name,
            stopCoords: [data.quays[i]?.stopPlace.latitude ?? parseFloat(csvData[i].stop_lat), 
                data.quays[i]?.stopPlace.longitude ?? parseFloat(csvData[i].stop_lon)],
            hasParking: csvData[i].has_parking === "1",
        }
        transferPoints.push(transferStop)
    }

    return transferPoints;
}

export async function getTripsForLines(): Promise<{availableTripsByLines: AvailableTrip[][], availableDates: number[]}> {
    const oneDayMilis = 86400000
    const dateResponse = await fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/availableDates`, {
        method: "GET",
        headers: {
            "Authorization": Deno.env.get("LISSY_API_KEY")
        }
    })
    if (!dateResponse.ok) {
        return [[], 0]
    }
    const dateResponseJson = await dateResponse.json();
    const endDate = dateResponseJson.end
    const startDate = dateResponseJson.end - oneDayMilis * 1

    const availableRoutesResponse = await fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/getAvailableRoutes?dates=[[${startDate},${endDate}]]`, {
        method: "GET",
        headers: {
            "Authorization": Deno.env.get("LISSY_API_KEY")
        }
    })

    if (!availableRoutesResponse.ok) {
        return [[], 0]
    }

    const availableRoutesJson = await availableRoutesResponse.json() as { route_short_name: string, id: number }[]
    const availableRouteFetches = availableRoutesJson.map((ar) => {
        return fetch(`${Deno.env.get("LISSY_API_URL")}/delayTrips/getAvailableTrips?dates=[[${startDate},${endDate}]]&route_id=${ar.id}`, {
            method: "GET",
            headers: {
                "Authorization": Deno.env.get("LISSY_API_KEY")
            }
        })
    })

    const availableTripsResponses = await Promise.all(availableRouteFetches)
    const availableTripsJson = await Promise.all(availableTripsResponses.map((a) => a.json())) as AvailableTrip[][]
    return {availableTripsByLines: availableTripsJson, availableDates: [startDate, endDate]}
}

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
 * @returns 
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
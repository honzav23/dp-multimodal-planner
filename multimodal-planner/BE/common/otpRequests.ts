import { rootDir } from "../api.ts";
import {parse} from "@std/csv"
import type {TransferStop} from "../../types/TransferStop.ts";
import {gql, request} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import type {OTPGraphQLTrip} from "../types/OTPGraphQLData.ts";
import type { TransportMode } from '../../types/TransportMode.ts'

/**
 * Gets available transfer stops from .csv file
 * @returns Promise of all transfer stops
 */
async function getTransferStops(): Promise<TransferStop[]> {
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
                    id
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
async function getCarTrip(from: [number, number], to: [number, number], dateTime: string): Promise<OTPGraphQLTrip> {
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
    const carRoute = await request(otpUrl, query, variables) as OTPGraphQLTrip
    return carRoute
}

/**
 * Returns the route from OTP if public transport was used
 * @param from
 * @param to
 * @param dateTime Date and time of departure (in ISO format)
 * @param transport Modes of transport used along the way (empty array means)
 * @param numTripPatterns Max number of patters to get
 * all means of transport
 * @returns Promise of the result from OTP
 */
async function getPublicTransportTrip(from: [number, number], to: [number, number], dateTime: string, transport: TransportMode[], numTripPatterns: number): Promise<OTPGraphQLTrip> {
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
    let publicTransportRoute = await request(otpUrl, query, variables) as OTPGraphQLTrip
    if (publicTransportRoute.trip.tripPatterns.length === 0) {
        variables.pageCursor = publicTransportRoute.trip.nextPageCursor
        publicTransportRoute = await request(otpUrl, query, variables)
    }
    return publicTransportRoute
}

export { getPublicTransportTrip, getCarTrip, getTransferStops }
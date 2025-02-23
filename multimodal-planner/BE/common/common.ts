import {parse, stringify} from "@std/csv"
import type {TransferStop, TransferStopCluster} from "../../types/TransferStop";
import {gql, request} from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";
import type {OTPGraphQLData} from "../types/OTPGraphQLData";
import type { TransportMode } from '../../types/TransportMode'

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

    const command = new Deno.Command("python3", {args: ["./scripts/getClusters.py"]})
    let { success } = await command.output()

    const transferPoints: TransferStop[] = []

    // The data from OTP are returned in order so this can be done
    for (let i = 0; i < csvData.length; i++) {
        const transferStop: TransferStop = {
            stopId: data.quays[i]?.stopPlace.id ?? csvData[i].stop_id,
            stopName: data.quays[i]?.stopPlace.name ?? csvData[i].stop_name,
            stopCoords: [data.quays[i]?.stopPlace.latitude ?? csvData[i].stop_lat, data.quays[i]?.stopPlace.longitude ?? csvData[i].stop_lon],
            hasParking: csvData[i].has_parking === "1",
        }
        transferPoints.push(transferStop)
    }

    return transferPoints;
}

function getGqlQueryString(): string {
    return gql`
        query trip($from: Location!, $to: Location!, $arriveBy: Boolean, $dateTime: DateTime, $modes: Modes) {
          trip(
            from: $from
            to: $to
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
                fromPlace {
                  name
                }
                toPlace {
                    name
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
export async function getRouteByPublicTransport(from: [number, number], to: [number, number], dateTime: string, transport: TransportMode[]): Promise<OTPGraphQLData> {
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
        numTripPatterns: 12
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
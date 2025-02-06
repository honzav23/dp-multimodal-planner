import type { TripRequest } from "./types/TripRequest.ts";
import { gql, request } from "https://deno.land/x/graphql_request/mod.ts";
import { TransferStopWithDistance } from "./types/TransferStopWithDistance.ts";
import { transferStops } from "./main.ts";

/**
 * Calculates the distance between two points on the Earth's surface.
 * 
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * 
 * @returns The distance between the two points in kilometers
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

    return distance;
}

/**
 * Retrieves the candidate transfer stops for a trip request that are too far from the destination.
 * @param tripRequest The trip request
 * @returns Candidate transfer stops
 */
async function getCandidateTransferStops(tripRequest: TripRequest): Promise<TransferStopWithDistance[]> {

    const transferPointsWithDistance: TransferStopWithDistance[] = transferStops.map((row) => {
        return {
            ...row,
            distanceFromOrigin: calculateDistance(tripRequest.origin[0], tripRequest.origin[1], row.stopLat, row.stopLon),
        }
    });

    const distanceFromOriginToDestination = calculateDistance(tripRequest.origin[0], tripRequest.origin[1], tripRequest.destination[0], tripRequest.destination[1]);

    const candidateTransferPoints = transferPointsWithDistance.filter((transferPoint) => transferPoint.distanceFromOrigin < distanceFromOriginToDestination);

    return candidateTransferPoints;
}

export async function calculateRoad(tripRequest: TripRequest): Promise<string> {
//     const variables = {
//         from: {
//           coordinates: {
//             latitude: tripRequest.origin[0],
//             longitude: tripRequest.origin[1]
//           }
//         },
//         to: {
//           coordinates: {
//             latitude: tripRequest.destination[0],
//             longitude: tripRequest.destination[1]
//           }
//         },
//         dateTime: "2025-01-17T14:00:15.000Z",
//         modes: {
//           accessMode: "flexible",
//           egressMode: "flexible",
//           directMode: "flexible"
//         },
//         numTripPatterns: 12
//       }


//     const query = gql`
//     query trip($from: Location!, $to: Location!, $arriveBy: Boolean, $dateTime: DateTime, $numTripPatterns: Int, $searchWindow: Int, $modes: Modes, $itineraryFiltersDebug: ItineraryFilterDebugProfile, $pageCursor: String) {
//   trip(
//     from: $from
//     to: $to
//     arriveBy: $arriveBy
//     dateTime: $dateTime
//     numTripPatterns: $numTripPatterns
//     searchWindow: $searchWindow
//     modes: $modes
//     itineraryFilters: {debug: $itineraryFiltersDebug}
//     pageCursor: $pageCursor
//   ) {
//     tripPatterns {
//       expectedEndTime
//       expectedStartTime
//       duration
//       distance
//       legs {
//         mode
//         expectedEndTime
//         expectedStartTime
//         realtime
//         distance
//         duration
//         fromPlace {
//           name
//           quay {
//             id
//           }
//         }
//         toPlace {
//           name
//           quay {
//             id
//           }
//         }
//         line {
//           publicCode
//         }
//         pointsOnLink {
//           points
//         }
//         interchangeTo {
//           staySeated
//         }
//         interchangeFrom {
//           staySeated
//         }
//       }
//     }
//   }
// }
//   `;

    console.log(tripRequest.preferences.transferStop?.stopId)
    const variables = {
        id: `1:${tripRequest.preferences.transferStop?.stopId}`
    }
    const query = gql`
        query stopPlace($id: String!) {
            stopPlace(id: $id) {
                latitude
            }
        }
    `;
    const data = await request("http://localhost:8080/otp/transmodel/v3", query, variables)
    // console.log(data)
    // console.log(tripRequest.preferences.transferStop)
    const candidateTransferPoints = await getCandidateTransferStops(tripRequest);
    
    return "Calculating road route";
}
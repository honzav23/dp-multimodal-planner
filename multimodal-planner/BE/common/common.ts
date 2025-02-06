import { parse } from "@std/csv"
import { TransferStop } from "../../types/TransferStop.ts";
import { gql, request } from "https://deno.land/x/graphql_request@v4.1.0/mod.ts";

export async function getTransferStops(): Promise<TransferStop[]> {
    const text = Deno.readTextFileSync('transferPointsWithParkingLots.csv');
    const csvData = parse(text, { skipFirstRow: true, separator: ';', strip: true });

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
    const data = await request("http://localhost:8080/otp/transmodel/v3", query, variables)
    
    const transferPoints: TransferStop[] = []

    // The data from OTP are returned in order so this can be done
    for (let i = 0; i < csvData.length; i++) {
        const transferStop: TransferStop = {
            stopId: data.quays[i].stopPlace.id ?? csvData[i].stop_id,
            stopName: data.quays[i].stopPlace.name ?? csvData[i].stop_name,
            stopLat: data.quays[i].stopPlace.latitude ?? csvData[i].stop_lat,
            stopLon: data.quays[i].stopPlace.longitude ?? csvData[i].stop_lon,
            hasParking: csvData[i].has_parking === "1"
        }
        transferPoints.push(transferStop)
    }

    console.log(transferPoints.length)

    return transferPoints;
}
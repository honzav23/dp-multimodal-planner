import { parse } from "@std/csv"
import { TransferStop } from "../../types/TransferStop.ts";

export function getTransferStops(): TransferStop[] {
    const text = Deno.readTextFileSync('transferPointsWithParkingLots.csv');
    const csvData = parse(text, { skipFirstRow: true, separator: ';', strip: true }); 
    
    const transferPoints: TransferStop[] = csvData.map((row) => {
        const latitude = parseFloat(row.stop_lat);
        const longitude = parseFloat(row.stop_lon);
        return {
            stopId: row.stop_id,
            stopName: row.stop_name,
            stopLat: latitude,
            stopLon: longitude,
            hasParking: row.has_parking === "1",
        }
    });

    return transferPoints;
}
import {parse, stringify} from "@std/csv"
import type {TransferStop, TransferStopCluster} from "../types/TransferStop.ts";

/**
 * Get only the transfer stops that are centers (nearest to it)
 * @param stops Stops that have clusters assigned to it
 */
function findRepresentativesFromClusters(stops: TransferStopCluster[]): TransferStopCluster[] {
    const uniqueCenters = new Set<number>(stops.map(s => s.nearest))
    return Array.from(uniqueCenters).map((center) => stops[center])
}

/**
 * Gets representative transfer stops for given transfer stops based on clustering
 * @param transferStops Available transfer stops
 * @returns Promise of the representative transfer stops
 */
export async function getRepresentativeTransferStops(transferStops: TransferStop[]): Promise<TransferStop[]> {
    const transferStopsSeparatedCoords = transferStops.map((transferStop: TransferStop) => (
        {
            stopId: transferStop.stopId,
            stopName: transferStop.stopName,
            stopLat: transferStop.stopCoords[0],
            stopLon: transferStop.stopCoords[1],
            hasParking: transferStop.hasParking,
        }
    ))
    const serializedTransferStops = stringify(transferStopsSeparatedCoords, {columns: ['stopId', 'stopName', 'stopLat', "stopLon", 'hasParking'], separator: ';'})
    Deno.writeTextFileSync('./transferStops/candidates.csv', serializedTransferStops)

    // Call Python script to find the clusters
    const command = new Deno.Command("python", {args: ["./scripts/getClusters.py"]})
    let { success } = await command.output()

    const text = Deno.readTextFileSync('./transferStops/candidatesClusters.csv');
    const csvData = parse(text, {skipFirstRow: true, separator: ';', strip: true});

    const candidatesWithClusters: TransferStopCluster[] = csvData.map((row) => (
        {
            stopId: row.stopId,
            stopName: row.stopName,
            stopCoords: [parseFloat(row.stopLat), parseFloat(row.stopLon)],
            hasParking: row.hasParking === "1",
            cluster: parseInt(row.cluster),
            nearest: parseInt(row.nearest),
        }
    ));

    return findRepresentativesFromClusters(candidatesWithClusters);
}

import {parse, stringify} from "@std/csv"
import type {TransferStop, TransferStopCluster} from "../types/TransferStop.ts";

function findRepresentativesFromClusters(stops: TransferStopCluster[]): TransferStopCluster[] {
    const centerCounts = new Set<number>()
    for (const stop of stops) {
        centerCounts.add(stop.nearest)
    }

    const returnStops: TransferStopCluster[] = []
    for (let center of centerCounts) {
        returnStops.push(stops[center])
    }
    return returnStops
}

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
    const command = new Deno.Command("python3", {args: ["./scripts/getClusters.py"]})
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

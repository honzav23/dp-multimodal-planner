/**
 * @file cluster.ts
 * @brief File that handles the clustering part of the algorithm
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import {parse, stringify} from "@std/csv"
import type {TransferStop} from "../types/TransferStop.ts";

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
    const command = new Deno.Command("python3", {args: ["./scripts/getClusters.py"]})
    let { success } = await command.output()

    const text = Deno.readTextFileSync('./transferStops/candidatesClusters.csv');
    const csvData = parse(text, {skipFirstRow: true, separator: ';', strip: true});

    const centersTransferStops: TransferStop[] = csvData.map((row) => (
        {
            stopId: row.stopId,
            stopName: row.stopName,
            stopCoords: [parseFloat(row.stopLat), parseFloat(row.stopLon)],
            hasParking: row.hasParking === "1",
        }
    ));

    return centersTransferStops
}

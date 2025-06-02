/**
 * @file parkingLotsNearby.ts
 * @brief This file contains functions that are used to get information about parking lost near
 * a certain transfer stop
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {transferStops} from "./api.ts";
import {OSMElement, OSMNode, OSMWay} from "./types/ParkingLotOSM.ts";
import {ParkingLot} from "../types/ParkingLot.ts";

/**
 * Fetch parking lots from Overpass turbo
 * @param stopId Id of a transfer stop which
 */
async function getParkingLotsFromOverpass(stopId: string): Promise<OSMElement[]> {
    const foundTransferStop = transferStops.find(t => t.stopId === stopId)
    if (!foundTransferStop) {
        return []
    }
    const [stopLat, stopLon] = foundTransferStop.stopCoords

    const query = `
        [out:json][timeout:25];
        (
            node["amenity"="parking"]["access"="yes"](around:500,${stopLat},${stopLon});
            way["amenity"="parking"]["access"="yes"](around:500,${stopLat},${stopLon});
            relation["amenity"="parking"]["access"="yes"](around:500,${stopLat},${stopLon});
        );
        out body;
        >;
        out skel qt;
    `

    const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
    })
    if (!response.ok) {
        return []
    }

    const result = await response.json();
    return result.elements as OSMElement[];
}

/**
 * Creates bounding box for a given parking lot
 * @param parkingLot Parking lot to create bounding box for
 * @param nodesObject Object containing the corners of the bounding box
 */
function getParkingLotBoundingBox(parkingLot: OSMWay, nodesObject: Record<number, OSMNode>): [number, number][] {
    const boundingBox: [number, number][] = parkingLot.nodes.map((n) => [nodesObject[n].lat, nodesObject[n].lon]);
    return boundingBox;
}

/**
 * Converts array of nodes to object where key is the id
 * of a given node
 * @param nodes Nodes to convert
 */
function convertNodesToObject(nodes: OSMNode[]): Record<number, OSMNode> {
    const nodesObject: Record<number, OSMNode> = {};
    for (const node of nodes) {
        nodesObject[node.id] = node;
    }
    return nodesObject;
}

function extractTags(parkingLotObj: Record<string, any>, parkingLot: OSMWay) {
    if ("capacity" in parkingLot.tags) {
        parkingLotObj["capacity"] = parseInt(parkingLot.tags.capacity);
    }
}

export async function fetchParkingLots(stopId: string) {
    const osmParkingLots = await getParkingLotsFromOverpass(stopId);
    const osmParkingLotsNodes: OSMNode[] = osmParkingLots.filter((p) => p.type === "node")
    const nodesObject = convertNodesToObject(osmParkingLotsNodes);

    const osmParkingLotsWays: OSMWay[] = osmParkingLots.filter((p) => p.type === "way")

    const parkingLots: ParkingLot[] = []

    for (const parkingLot of osmParkingLotsWays) {
        const parkingLotObj: Record<string, any> = {}
        const parkingLotPolygon = getParkingLotBoundingBox(parkingLot, nodesObject)
        parkingLotObj["polygon"] = parkingLotPolygon
        extractTags(parkingLotObj, parkingLot)


        parkingLots.push(parkingLotObj as ParkingLot)
    }

    return parkingLots
}
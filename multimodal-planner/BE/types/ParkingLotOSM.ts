/**
 * @file ParkingLotOSM.ts
 * @brief File that contains all type definition for parking lot that is fetched from
 * Overpass turbo
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

export type OSMTag = Record<string, any> | {
    capacity?: string,
    'capacity:disabled'?: string
    'fee:conditional'?: string,
    'maxstay:conditional'?: string,
    fee?: "yes" | "no" | "donation" | "unknown",
    charge?: string,
    maxstay?: string,
    park_ride?: string,
    name?: string,
    opening_hours?: string,
    website?: string
}

export type OSMNode = {
    type: "node",
    id: number,
    lat: number,
    lon: number
}

export type OSMWay = {
    type: "way",
    id: number,
    nodes: number[],
    tags?: OSMTag
}

export type OSMElement = (OSMNode | OSMWay)

/**
 * @file ParkingLotOSM.ts
 * @brief File that contains all type definition for parking lot that is fetched from
 * Overpass turbo
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

export type OSMTag = Record<string, any> | {
    capacity?: string
} // TODO make it more accurate

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
    tags: OSMTag
}

export type OSMElement = (OSMNode | OSMWay)

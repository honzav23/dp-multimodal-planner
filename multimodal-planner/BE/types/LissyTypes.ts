/**
 * @file LissyTypes.ts
 * @brief File that contains all types of data that are fetched from Lissy
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type { LatLngTuple } from "../../types/TripRequest.ts";

export type LissyObj = {
    availableTripsByLines: LissyAvailableTrip[][],
    availableDates: string[]
}

export type LissyAvailableDates = {
    start: string,
    disabled: [string],
    end: string,
}

export type LissyAvailableRoute = {
    id: number,
    route_short_name: string
}

export type LissyAvailableTrip = {
    shape_id: number,
    stops: string,
    trips: {
        id: number,
        dep_time: string
    }[],
    stopOrder: string[]
}

export type LissyShape = {
    coords: LatLngTuple[][],
    stops: {
        stop_name: string,
        wheelchair_boarding: number,
        zone_id: number,
        coords: LatLngTuple,
    }[]
}

/**
 * date1: {
 *     tripSegment1: {
 *         subsegment1: 0, subsegment5: 1
 *     },
 *     tripSegment2: {
 *         subsegment1: 3, subsegment5: 2
 *     },
 *     ...
 * date2: {
 *     ...
 * }
 * }
 */
export type LissyDelay = Record<string, Record<string, Record<string, number>>>
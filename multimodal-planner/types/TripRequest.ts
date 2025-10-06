/**
 * @file TripRequest.ts
 * @brief Contains the type definition of a trip request that backend uses
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type { TransferStop } from "./TransferStop.ts";
import type { TransportMode } from "./TransportMode.ts"

export type LatLngTuple = [number, number];

export type TripRequest = {
    origin: LatLngTuple;
    destination: LatLngTuple;
    departureDateTime: string;
    preferences: TripPreferences;
}

export type TripPreferences = {
    modeOfTransport: TransportMode[];
    showWazeEvents: boolean;
    useOnlyPublicTransport: boolean;
    transferStop: TransferStop | null;
    findBestTrip: boolean;
    pickupCoords: LatLngTuple;
    comingBack: {
        returnDateTime: string
    } | null;
}
/**
 * @file TripRequest.ts
 * @brief Contains the type definition of a trip request that backend uses
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type { TransferStop } from "./TransferStop.ts";
import type { TransportMode } from "./TransportMode.ts"

export type TripRequest = {
    origin: [number, number];
    destination: [number, number];
    departureDateTime: string;
    preferences: TripPreferences;
}

export type TripPreferences = {
    modeOfTransport: TransportMode[];
    showWazeEvents: boolean;
    useOnlyPublicTransport: boolean;
    transferStop: TransferStop | null;
    findBestTrip: boolean;
    pickupCoords: [number, number];
    comingBack: {
        returnDateTime: string
    } | null;
}
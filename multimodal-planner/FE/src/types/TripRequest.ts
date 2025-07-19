/**
 * @file TripRequest.ts
 * @brief Defines the type for trip request that goes to the server
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type { LatLngTuple } from "leaflet";
import type { TransferStop } from "../../../types/TransferStop";
import type { TransportMode } from "../../../types/TransportMode"

export type TripRequest = {
    origin: LatLngTuple;
    destination: LatLngTuple;
    departureDate: string;
    departureTime: string;
    preferences: {
        modeOfTransport: TransportMode[];
        useOnlyPublicTransport: boolean;
        transferStop: TransferStop | null;
        findBestTrip: boolean;
        pickupCoords: LatLngTuple
        comingBack: {
            returnDate: string;
            returnTime: string
        } | null;
    };
}
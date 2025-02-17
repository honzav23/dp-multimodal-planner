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
        transferStop: TransferStop | null;
        minimizeTransfers: boolean;
    };
}
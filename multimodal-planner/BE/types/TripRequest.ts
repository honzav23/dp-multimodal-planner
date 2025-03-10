import type { TransferStop } from "../../types/TransferStop";
import type { TransportMode } from "../../types/TransportMode"

export type TripRequest = {
    origin: [number, number];
    destination: [number, number];
    departureDateTime: string;
    preferences: {
        modeOfTransport: TransportMode[];
        transferStop: TransferStop | null;
        minimizeTransfers: boolean;
        findBestTrip: boolean;
        pickupCoords: [number, number]
        comingBack: {
            returnDateTime: string
        } | null;
    };
}
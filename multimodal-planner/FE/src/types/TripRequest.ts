import { LatLngTuple } from "leaflet";
import { TransferStop } from "../../../types/TransferStop";

export type TripRequest = {
    origin: LatLngTuple;
    destination: LatLngTuple;
    departureDate: string;
    departureTime: string;
    preferences: {
        modeOfTransport: ['bus' | 'train' | 'tram' | 'trolleybus'] | null;
        transferPoint: TransferStop | null;
        minimizeTransfers: boolean;
    };
}
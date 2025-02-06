import { TransferStop } from "../../types/TransferStop.ts";

export type TripRequest = {
    origin: [number, number];
    destination: [number, number];
    departureDate: string;
    preferences: {
        modeOfTransport: ['bus' | 'train' | 'tram' | 'trolleybus'] | null;
        transferStop: TransferStop | null;
        minimizeTransfers: boolean;
    };
}
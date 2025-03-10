import {TransferStop} from "../../../types/TransferStop.ts";

export const trip: Record<string, any> = {
    origin: [49.27958, 16.37228],
    destination: [49.14721, 16.89980],
    departureDate: "2025-02-03",
    departureTime: "14:10:00",
    preferences: {
        modeOfTransport: [],
        minimizeTransfers: false,
        findBestTrip: false,
        transferStop: null,
        pickupCoords: [49.1848, 16.37228],
        comingBack: null
    }
}

export const transferStop: TransferStop = {
    stopId: '12345',
    stopName: 'Test stop',
    stopCoords: [49.27958, 16.37228],
    hasParking: false
}
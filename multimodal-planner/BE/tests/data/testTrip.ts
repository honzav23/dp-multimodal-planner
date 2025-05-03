import {TransferStop} from "../../../types/TransferStop.ts";
import { TripDecision } from "../../types/TripDecision.ts";

export const trip: Record<string, any> = {
    origin: [49.27958, 16.37228],
    destination: [49.14721, 16.89980],
    departureDate: "2025-02-03",
    departureTime: "14:10:00",
    preferences: {
        modeOfTransport: [],
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

// Normalized values are not used in the tests
export const tripsParetoOneOptimal: TripDecision[] = [
    {
        tripIndex: 0,
        totalTime: 85,
        totalTransfers: 2,
        totalEmissions: 120,
        totalDelay: 0,
        totalTimeNormalized: 0.72,
        totalEmissionsNormalized: 0.68,
        totalTransfersNormalized: 0.4,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 1,
        totalTime: 65,
        totalTransfers: 1,
        totalEmissions: 90,
        totalDelay: 0,
        totalTimeNormalized: 0.55,
        totalEmissionsNormalized: 0.5,
        totalTransfersNormalized: 0.2,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 2,
        totalTime: 110,
        totalTransfers: 3,
        totalEmissions: 150,
        totalDelay: 0,
        totalTimeNormalized: 0.95,
        totalEmissionsNormalized: 0.85,
        totalTransfersNormalized: 0.6,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 3,
        totalTime: 45,
        totalTransfers: 0,
        totalEmissions: 60,
        totalDelay: 0,
        totalTimeNormalized: 0.3,
        totalEmissionsNormalized: 0.35,
        totalTransfersNormalized: 0,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 4,
        totalTime: 95,
        totalTransfers: 2,
        totalEmissions: 130,
        totalDelay: 0,
        totalTimeNormalized: 0.8,
        totalEmissionsNormalized: 0.75,
        totalTransfersNormalized: 0.4,
        totalDelayNormalized: 0
    }
]

export const tripsParetoMoreOptimal: TripDecision[] = [
    {
        tripIndex: 0,
        totalTime: 95,
        totalTransfers: 2,
        totalEmissions: 130,
        totalDelay: 0,
        totalTimeNormalized: 0.8,
        totalEmissionsNormalized: 0.75,
        totalTransfersNormalized: 0.4,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 1,
        totalTime: 100,
        totalTransfers: 3,
        totalEmissions: 160,
        totalDelay: 0,
        totalTimeNormalized: 0.8,
        totalEmissionsNormalized: 0.75,
        totalTransfersNormalized: 0.4,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 2,
        totalTime: 70,
        totalTransfers: 3,
        totalEmissions: 130,
        totalDelay: 0,
        totalTimeNormalized: 0.8,
        totalEmissionsNormalized: 0.75,
        totalTransfersNormalized: 0.4,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 3,
        totalTime: 120,
        totalTransfers: 2,
        totalEmissions: 80,
        totalDelay: 0,
        totalTimeNormalized: 0.8,
        totalEmissionsNormalized: 0.75,
        totalTransfersNormalized: 0.4,
        totalDelayNormalized: 0
    },
    {
        tripIndex: 4,
        totalTime: 150,
        totalTransfers: 4,
        totalEmissions: 200,
        totalDelay: 0,
        totalTimeNormalized: 0.8,
        totalEmissionsNormalized: 0.75,
        totalTransfersNormalized: 0.4,
        totalDelayNormalized: 0
    },
]    

// Not pareto optimal trips: 
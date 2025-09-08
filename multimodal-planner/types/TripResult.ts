import { type WazeEvents } from "./WazeEvents.ts";

export type TripResult = {
    totalTime: number, // In seconds
    totalDistance: number, // In kilometers
    startTime: string,
    endTime: string,
    legs: TripLeg[],
    totalTransfers: number,
    totalEmissions: number,
    via: string,
    lowestTime: boolean,
    lowestEmissions: boolean,
    bestOverall: boolean,
    wazeEvents: WazeEvents
}

export type TripResultWithId = TripResult & { uuid: string }
export type TripResultWithIdConvertedRoute = Omit<TripResultWithId, 'legs'> & { legs: TripLegConvertedRoute[] }

export type TripLeg = {
    startTime: string,
    endTime: string,
    modeOfTransport: TransportMode,
    from: string,
    to: string,
    distance: number,
    line: string,
    route: string,
    delays: DelaysForLeg
}

export type TripLegConvertedRoute = Omit<TripLeg, 'route'> & { route: [number, number][] }

// The same modes of transport as in OTP2
export type TransportMode = 'foot' | 'car' | 'rail' | 'bus' | 'tram' | 'trolleybus' | 'metro' | 'air' | 'bicycle'
    | 'cableway' | 'water' | 'funicular' | 'lift' | 'taxi' | 'monorail' | 'coach' | 'scooter'

export type TripResponse = {
    outboundTrips: TripResultWithId[],
    returnTrips: TripResultWithId[],
}

export type TripResponseConvertedRoute = {
    outboundTrips: TripResultWithIdConvertedRoute[],
    returnTrips: TripResultWithIdConvertedRoute[],
}

export type DelaysForLeg = {
    averageDelay: number,
    currentDelay: number,
    pastDelays: DelayInfo[]
}

export type DelayInfo = {
    delayDate: string, // YYYY-MM-DD,
    delay: number, // In minutes
}
export type TripResult = {
    totalTime: number,
    totalDistance: number, // In kilometers
    startTime: string,
    endTime: string,
    legs: TripLeg[],
    totalTransfers: number,
    totalEmissions: number,
    via: string,
    lowestTime: boolean,
    lowestEmissions: boolean
}

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

// The same modes of transport as in OTP2
export type TransportMode = 'foot' | 'car' | 'rail' | 'bus' | 'tram' | 'trolleybus' | 'metro' | 'air' | 'bicycle'
    | 'cableway' | 'water' | 'funicular' | 'lift' | 'taxi' | 'monorail' | 'coach' | 'scooter'

export type TripResponse = {
    outboundTrips: TripResult[],
    returnTrips: TripResult[],
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
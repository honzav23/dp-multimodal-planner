export type TripResult = {
    totalTime: number,
    totalDistance: number, // In kilometers
    startTime: string,
    endTime: string,
    legs: TripLeg[],
    totalTransfers: number
}

export type TripLeg = {
    startTime: string,
    endTime: string,
    modeOfTransport: string,
    from: string,
    to: string,
    distance: number,
    line: string,
    route: string,
    averageDelay: number,
    delayInfo: DelayInfo[]
}

export type TripResponse = {
    outboundTrips: TripResult[],
    returnTrips: TripResult[],
}

export type DelayInfo = {
    delayDate: number, // Unix timestamp,
    delay: number, // In minutes
}
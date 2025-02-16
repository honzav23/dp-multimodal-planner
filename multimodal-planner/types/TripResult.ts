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
    line: string,
    route: string
}
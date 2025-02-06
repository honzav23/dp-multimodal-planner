export type TripResult = {
    totalTime: string,
    totalDistance: number, // In kilometers
    startTime: string,
    endTime: string,
    trip: TripProperties[]
}

type TripProperties = {
    startTime: string,
    endTime: string,
    modeOfTransport: string,
    from: string,
    to: string,
    line: string,
    route: string
}
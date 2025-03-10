export type OTPGraphQLData = {
    trip: {
        tripPatterns: OTPTripPattern[]
    }
}

export type OTPTripPattern = {
    aimedStartTime: string,
    aimedEndTime: string,
    distance: number,
    duration: number,
    legs: OTPTripLeg[]
}

export type OTPTripLeg = {
    mode: string,
    aimedStartTime: string,
    aimedEndTime: string,
    distance: number,
    serviceJourney: {
        quays: {
          name: string,
        }[]
    },
    fromPlace: {
        name: string,
    },
    toPlace: {
        name: string,
        latitude: number,
        longitude: number
    },
    line: {
        publicCode: string | null
    },
    pointsOnLink: {
        points: string
    }
}
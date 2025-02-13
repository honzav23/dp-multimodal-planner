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
    fromPlace: {
        name: string,
    },
    toPlace: {
        name: string,
    },
    line: {
        publicCode: string | null
    },
    pointsOnLink: {
        points: string
    }
}
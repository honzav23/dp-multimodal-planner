export type OTPGraphQLData = {
    trip: {
        tripPatterns: OTPTripPattern[]
    }
}

type OTPTripPattern = {
    aimedStartTime: string,
    aimedEndTime: string,
    distance: number,
    duration: number,
    legs: OTPTripLeg[]
}

type OTPTripLeg = {
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
export type OTPGraphQLData = {
    trip: {
        nextPageCursor: string | null
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
          id: string
        }[],
        passingTimes: {
            departure: {
                time: string
            }
        }[]
    },
    fromPlace: {
        name: string,
        quay: {
            id: string
        }
    },
    toPlace: {
        name: string,
        latitude: number,
        longitude: number,
        quay: {
            id: string
        }
    },
    line: {
        publicCode: string | null
    },
    pointsOnLink: {
        points: string
    }
}
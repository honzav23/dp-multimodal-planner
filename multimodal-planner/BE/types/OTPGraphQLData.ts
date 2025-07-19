/**
 * @file OTPGraphQLData.ts
 * @brief File that contains all types for data that OTP returns for particular
 * backend requests
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

export type OTPGraphQLTrip = {
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
        id: string | null
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
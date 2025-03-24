import type { TripResult } from "../types/TripResult.ts";
import type { TripDecision } from "./types/TripDecision.ts";

// Below are average emissions according to https://www.rekrabicka.cz/blog/ekologicky-dopad-dopravnich-prostredku
// The values are grams of CO2 per kilometer per passenger
const CAR_EMISSIONS = 192
const BUS_EMISSIONS = 68
const TRAIN_EMISSIONS = 35

/**
 * Comparison matrix for criteria using AHP method
 * Index 0: Time of arrival
 * Index 1: Time of departure
 * Index 2: Total amount of emissions
 * Index 3: Delay
 * Index 4: Number of transfers
*/
const comparisonMatrixForCriteria = [
    [1, 3, 1, 5, 3],
    [1/3, 1, 1/3, 1/3, 1/5],
    [1, 3, 1, 1/3, 5],
    [1/5, 3, 3, 1, 7],
    [1/3, 5, 1/5, 1/7, 1]
]

function calculateWeights(): number[] {
    const products = comparisonMatrixForCriteria.map(row => {
        return row.reduce((a, b) => a * b)
    })
    const rawWeights = products.map((product) => Math.pow(product, 1 / comparisonMatrixForCriteria.length))
    
    const weightSum = rawWeights.reduce((a, b) => a + b)

    const normalizedWeights = rawWeights.map((weight) => weight / weightSum)
    return normalizedWeights
}

const weights = calculateWeights()

/**
 * Calculates the total amount of emissions based on the distance and mode of transport of
 * individual legs
 * @param trip Trip to calculate emissions from
 * @returns Total amount of emissions for a given trip
 */
function getTotalEmissions(trip: TripResult): number {
    let totalEmissions = 0

    for (const leg of trip.legs) {
        switch (leg.modeOfTransport) {
            case "car":
                totalEmissions += leg.distance * CAR_EMISSIONS
                break
            case "rail":
                totalEmissions += leg.distance * TRAIN_EMISSIONS
                break
            case "bus":
                totalEmissions += leg.distance * BUS_EMISSIONS
                break

            default:
                break
        }
    }
    return totalEmissions
}

export function getParetoOptimalTrips(trips: TripDecision[]): TripDecision[] {
    let optimalTrips: TripDecision[] = [];

    for (const trip of trips) {
        // Remove trips that are dominated by the new trip
        optimalTrips = optimalTrips.filter(existingTrip =>
            !dominates(trip, existingTrip)
        );

        // Only add the new trip if it is not dominated by any existing trip
        if (!optimalTrips.some(existingTrip => dominates(existingTrip, trip))) {
            optimalTrips.push(trip);
        }
    }

    return optimalTrips;
}

// Helper function to check if trip A dominates trip B
function dominates(a: TripDecision, b: TripDecision): boolean {
    let betterInAtLeastOne = false;

    // Trip A is worse in at least one parameter
    if (a.totalTime > b.totalTime || a.totalEmissions > b.totalEmissions || a.totalTransfers > b.totalTransfers) {
        return false
    }

    // At least one metric must be strictly better
    if (a.totalTime < b.totalTime || a.totalEmissions < b.totalEmissions || a.totalTransfers < a.totalTransfers) {
        betterInAtLeastOne = true;
    }

    return betterInAtLeastOne;
}

function normalizeCriteria(tripRankings: TripDecision[]) {
    const len = tripRankings.length
    const sortByTotalTime = [...tripRankings].sort((a, b) => a.totalTime - b.totalTime)
    const sortByTransfers = [...tripRankings].sort((a, b) => a.totalTransfers - b.totalTransfers)
    const sortByEmissions = [...tripRankings].sort((a, b) => a.totalEmissions - b.totalEmissions)
    const sortByDelay = [...tripRankings].sort((a, b) => a.totalDelay - b.totalDelay)

    const minTime = sortByTotalTime[0].totalTime
    const maxTime = sortByTotalTime[len - 1].totalTime

    const minTransfers = sortByTransfers[0].totalTransfers
    const maxTransfers = sortByTransfers[len - 1].totalTransfers

    const minEmissions = sortByEmissions[0].totalEmissions
    const maxEmissions = sortByEmissions[len - 1].totalEmissions

    const minDelay = sortByDelay[0].totalDelay
    const maxDelay = sortByDelay[len - 1].totalDelay

    for (let i = 0; i < len; i++) {
        tripRankings[i].totalTimeNormalized = (tripRankings[i].totalTime - minTime) / (maxTime - minTime)
        tripRankings[i].totalTransfersNormalized = (tripRankings[i].totalTransfers - minTransfers) / (maxTransfers - minTransfers)
        tripRankings[i].totalEmissionsNormalized = (tripRankings[i].totalEmissions - minEmissions) / (maxEmissions - minEmissions)
        tripRankings[i].totalDelayNormalized = (tripRankings[i].totalDelay - minDelay) / (maxDelay - minDelay)
    }
}

export function findBestTrips(trips: TripResult[]): TripResult[] {
    if (trips.length === 0 || trips.length === 1) {
        return trips
    }
    let tripsWithScores: {trip: TripDecision, score: number}[] = []
    
    let tripRankings: TripDecision[] = []
    for (let i = 0; i < trips.length; i++) {
        const delaySum = trips[i].legs.reduce((acc, leg) => acc + leg.averageDelay, 0)
        tripRankings.push(
            {
                tripIndex: i,
                totalTime: trips[i].totalTime / 60,
                totalTransfers: trips[i].totalTransfers,
                totalEmissions: getTotalEmissions(trips[i]),
                totalDelay: delaySum,
                totalTimeNormalized: 0,
                totalTransfersNormalized: 0,
                totalEmissionsNormalized: 0,
                totalDelayNormalized: 0
            } as TripDecision
        )
    }
    tripRankings = getParetoOptimalTrips(tripRankings)
    normalizeCriteria(tripRankings)
    tripsWithScores = tripRankings.map((val) => (
        { 
            trip: val, 
            score: val.totalTimeNormalized * weights[0] + val.totalEmissionsNormalized * weights[2] + val.totalDelayNormalized * weights[3] + val.totalTransfersNormalized * weights[4]
        }))

    tripsWithScores.sort((a, b) => a.score - b.score)

    // Return 10 best solutions
    return tripsWithScores.map((val) => trips[val.trip.tripIndex]).slice(0, 10)
}
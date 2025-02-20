import { TripResult } from "../types/TripResult.ts";

/**
 * Comparison matrix for criteria using AHP method
 * Index 0: time of arrival
 * Index 1: time of departure
 * Index 2: amount of time spent in public transport compared to the total time
 * Index 3: Delay
 * Index 4: Number of transfers
*/
const comparisonMatrixForCriteria = [
    [1, 3, 5, 5, 3],
    [1/3, 1, 1/3, 1/3, 1/5],
    [1/5, 3, 1, 1/3, 1/7],
    [1/5, 3, 3, 1, 7],
    [1/3, 5, 7, 1/7, 1]
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

export function findBestTrips(trips: TripResult[]): TripResult[] {
    if (trips.length === 0 || trips.length === 1) {
        return trips
    }
    const tripsWithScores: {trip: TripResult, score: number}[] = []
    
    for (const trip of trips) {
        const timeOfArrival = trip.totalTime / 60
        const numberOfTransfers = trip.totalTransfers
        tripsWithScores.push({trip, score: timeOfArrival * weights[0] + numberOfTransfers * weights[4]})
    }
    tripsWithScores.sort((a, b) => a.score - b.score)
    return tripsWithScores.map((t) => t.trip)
}
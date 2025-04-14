/**
 * @file transferStopSelector.ts
 * @brief
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import type { TripResult } from "../types/TripResult.ts";
import type { TripDecision } from "./types/TripDecision.ts";

// Below are average emissions according to https://www.rekrabicka.cz/blog/ekologicky-dopad-dopravnich-prostredku
// The values are grams of CO2 per kilometer per passenger
const CAR_EMISSIONS = 192
const BUS_EMISSIONS = 68
const TRAIN_EMISSIONS = 35

/**
 * Comparison matrix for criteria using AHP method (https://backend.orbit.dtu.dk/ws/portalfiles/portal/104276012/DTU_Transport_Compendium_Part_2_MCDA_.pdf)
 * Index 0: Time of arrival
 * Index 1: Total amount of emissions
 * Index 2: Delay
 * Index 3: Number of transfers
*/
const comparisonMatrixForCriteria = [
    [1, 5, 3, 7],
    [1/5, 1, 1/5, 3],
    [1/3, 5, 1, 7],
    [1/7, 1/3, 1/7, 1]
]

function calculateWeights(): number[] {
    // Calculate geometric mean of the matrix rows
    const products = comparisonMatrixForCriteria.map(row => {
        return row.reduce((a, b) => a * b)
    })
    const rawWeights = products.map((product) => Math.pow(product, 1 / comparisonMatrixForCriteria.length))

    // Normalize weights
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
    trip.totalEmissions = totalEmissions
    return totalEmissions
}

/**
 * Find pareto optimal trips
 * @param trips Array to find the pareto optimal trips from
 *
 * @returns Pareto optimal trips
 */
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

/**
 * Helper function that checks if tripA dominates tripB
 * @param tripA
 * @param tripB
 */
function dominates(tripA: TripDecision, tripB: TripDecision): boolean {
    let betterInAtLeastOne = false;

    // Trip A is worse in at least one parameter
    if (tripA.totalTime > tripB.totalTime || tripA.totalEmissions > tripB.totalEmissions || tripA.totalTransfers > tripB.totalTransfers) {
        return false
    }

    // At least one metric must be strictly better
    if (tripA.totalTime < tripB.totalTime || tripA.totalEmissions < tripB.totalEmissions || tripA.totalTransfers < tripB.totalTransfers) {
        betterInAtLeastOne = true;
    }

    return betterInAtLeastOne;
}

/**
 * Gets min and max value from array by selected prop
 * @param tripRankings Array to get the values from
 * @param prop Property by which to get the min and max
 * @returns [minVal, maxVal]
 */
function getMinAndMaxByProperty(tripRankings: TripDecision[], prop: 'totalTime' | 'totalTransfers' | 'totalEmissions' | 'totalDelay'): [number, number] {
    return tripRankings.reduce((acc, val) => {
        return [Math.min(acc[0], val[prop]), Math.max(acc[1], val[prop])]
    }, [tripRankings[0][prop], tripRankings[1][prop]])
}

/**
 *
 * @param tripRankings
 */
function normalizeCriteria(tripRankings: TripDecision[]) {

    const [minTime, maxTime] = getMinAndMaxByProperty(tripRankings, "totalTime")
    const [minTransfers, maxTransfers] = getMinAndMaxByProperty(tripRankings, "totalTransfers")
    const [minEmissions, maxEmissions] = getMinAndMaxByProperty(tripRankings, "totalEmissions")
    const [minDelay, maxDelay] = getMinAndMaxByProperty(tripRankings, "totalDelay")


    for (let i = 0; i < tripRankings.length; i++) {
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
            score: val.totalTimeNormalized * weights[0] + val.totalEmissionsNormalized * weights[1] + val.totalDelayNormalized * weights[2] + val.totalTransfersNormalized * weights[3]
        }))

    tripsWithScores.sort((a, b) => a.score - b.score)

    // Get 10 best solutions
    const bestTrips = tripsWithScores.map((val) => trips[val.trip.tripIndex]).slice(0, 10)

    const minTimeTrip = bestTrips.reduce((min, trip) => trip.totalTime < min.totalTime ? trip : min, bestTrips[0])
    minTimeTrip.lowestTime = true

    const minEmissionsTrip = bestTrips.reduce((min, trip) => trip.totalEmissions < min.totalEmissions ? trip : min, bestTrips[0])
    minEmissionsTrip.lowestEmissions = true

    return bestTrips
}
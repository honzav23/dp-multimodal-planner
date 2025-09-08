/**
 * @file tripSelector.ts
 * @brief File containing algorithms for choosing the best trips
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type {TripLeg, TripResult} from "../types/TripResult.ts";
import type { TripDecision } from "./types/TripDecision.ts";
import {addSeconds} from "./common/common.ts";

export class TripSelector {
    /**
     * Comparison matrix for criteria using AHP method (https://backend.orbit.dtu.dk/ws/portalfiles/portal/104276012/DTU_Transport_Compendium_Part_2_MCDA_.pdf)
     * Index 0: Time of arrival
     * Index 1: Total amount of emissions
     * Index 2: Delay
     * Index 3: Number of transfers
     * Index 4: Public transport distance / totalDistance
     */
    private readonly comparisonMatrixForCriteria = [
        [1, 5, 3, 7, 1/3],
        [1/5, 1, 1/5, 3, 1/9],
        [1/3, 5, 1, 7, 1/9],
        [1/7, 1/3, 1/7, 1, 1/9],
        [3, 9, 9, 9, 1]
    ]
    private readonly weights: number[] = []
    private readonly bestTripsCandidates: TripResult[] = []

    constructor(tripResults: TripResult[]) {
        this.weights = this.calculateWeights()
        this.bestTripsCandidates = tripResults
    }

    private calculateWeights(): number[] {
        // Calculate geometric mean of the matrix rows
        const products = this.comparisonMatrixForCriteria.map(row => {
            return row.reduce((a, b) => a * b)
        })
        const rawWeights = products.map((product) => Math.pow(product, 1 / this.comparisonMatrixForCriteria.length))

        // Normalize weights
        const weightSum = rawWeights.reduce((a, b) => a + b)
        return rawWeights.map((weight) => weight / weightSum)
    }

    /**
     * Find pareto optimal trips
     * @param trips Array to find the pareto optimal trips from
     *
     * @returns Pareto optimal trips
     */
    private getParetoOptimalTrips(trips: TripDecision[]): TripDecision[] {

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
     * Gets min and max value from array by selected prop
     * @param tripRankings Array to get the values from
     * @param prop Property by which to get the min and max
     * @returns [minVal, maxVal]
     */
    private getMinAndMaxByProperty(tripRankings: TripDecision[], prop: 'totalTime' | 'totalTransfers' | 'totalEmissions' | 'totalDelay'): [number, number] {
        return tripRankings.reduce((acc, val) => {
            return [Math.min(acc[0], val[prop]), Math.max(acc[1], val[prop])]
        }, [tripRankings[0][prop], tripRankings[0][prop]])
    }

    /**
     * Performs MinMax normalization
     * @param currentValue Value to calculate normalized value for
     * @param min Minimal value
     * @param max Maximal value
     */
    private minMaxNormalization(currentValue: number, min: number, max: number): number {
        if (min === max) {
            return 0
        }
        return (currentValue - min) / (max - min)
    }

    /**
     * Normalize all criteria used in trips
     * @param tripRankings Trips which criteria need to be normalized
     */
    private normalizeCriteria(tripRankings: TripDecision[]) {

        const [minTime, maxTime] = this.getMinAndMaxByProperty(tripRankings, "totalTime")
        const [minTransfers, maxTransfers] = this.getMinAndMaxByProperty(tripRankings, "totalTransfers")
        const [minEmissions, maxEmissions] = this.getMinAndMaxByProperty(tripRankings, "totalEmissions")
        const [minDelay, maxDelay] = this.getMinAndMaxByProperty(tripRankings, "totalDelay")


        for (let i = 0; i < tripRankings.length; i++) {
            tripRankings[i].totalTimeNormalized = this.minMaxNormalization(tripRankings[i].totalTime, minTime, maxTime)
            tripRankings[i].totalTransfersNormalized = this.minMaxNormalization(tripRankings[i].totalTransfers, minTransfers, maxTransfers)
            tripRankings[i].totalEmissionsNormalized = this.minMaxNormalization(tripRankings[i].totalEmissions, minEmissions, maxEmissions)
            tripRankings[i].totalDelayNormalized = this.minMaxNormalization(tripRankings[i].totalDelay, minDelay, maxDelay)

            if (tripRankings[i].publicTransportDistanceToTotalDistanceRatio >= 0 && tripRankings[i].publicTransportDistanceToTotalDistanceRatio <= 0.5) {
                tripRankings[i].publicTransportDistanceToTotalDistanceRatioNormalized = 1 - 8 * Math.pow(tripRankings[i].publicTransportDistanceToTotalDistanceRatio, 3)
            }
            else {
                tripRankings[i].publicTransportDistanceToTotalDistanceRatioNormalized = 1 - 4 * Math.pow(1 - tripRankings[i].publicTransportDistanceToTotalDistanceRatio, 2)
            }
        }
    }
    // Flag that given trip has the lowest time or lowest consumption
    private flagTheBestTimeAndConsumption(bestTrips: TripResult[]) {
        const minTimeTrip = bestTrips.reduce((min, trip) => trip.totalTime < min.totalTime ? trip : min)
        minTimeTrip.lowestTime = true

        const minEmissionsTrip = bestTrips.reduce((min, trip) => trip.totalEmissions < min.totalEmissions ? trip : min)
        minEmissionsTrip.lowestEmissions = true
    }

    private hasCriticalDelay(trip: TripResult): boolean {

        const isPublicTransport = (leg: TripLeg) => {
            return leg.modeOfTransport !== 'car' && leg.modeOfTransport !== 'foot';
        }

        for (let i = 0; i < trip.legs.length - 1; i++) {
            const legDelay = trip.legs[i].delays.currentDelay !== -1 ? trip.legs[i].delays.currentDelay : trip.legs[i].delays.averageDelay
            if (isPublicTransport(trip.legs[i])) {
                let endLegDateWithDelayUnixValue = 0
                let nextLegStartDateUnixValue = 0

                // Case when public transport leg is followed by another public transport leg
                if (isPublicTransport(trip.legs[i+1])) {
                    const endLegDateWithDelay = addSeconds(trip.legs[i].endTime, legDelay * 60)
                    endLegDateWithDelayUnixValue = Date.parse(endLegDateWithDelay)
                    nextLegStartDateUnixValue = Date.parse(trip.legs[i+1].startTime)
                }

                // Case when public transport leg is followed by walking (to another stop for example) which is followed
                // by public transport
                else if (trip.legs[i+1].modeOfTransport === 'foot') {
                    if (i + 2 < trip.legs.length && isPublicTransport(trip.legs[i+2])) {
                        const differenceBetweenEndAndStartOfWalkingInSeconds = Math.ceil((Date.parse(trip.legs[i+1].endTime) - Date.parse(trip.legs[i+1].startTime)) / 1000)

                        const endLegDateWithDelayAndWalking = addSeconds(trip.legs[i].endTime, legDelay * 60 + differenceBetweenEndAndStartOfWalkingInSeconds)
                        endLegDateWithDelayUnixValue = Date.parse(endLegDateWithDelayAndWalking)
                        nextLegStartDateUnixValue = Date.parse(trip.legs[i+2].startTime)
                    }
                }
                // Return true if the leg with the delays (+ walking time) ends later than the following leg begins
                return endLegDateWithDelayUnixValue > nextLegStartDateUnixValue
            }
        }
        return false
    }

    private getTotalPublicTransportDistance(trip: TripResult) {
        return trip.legs.reduce((acc, leg) => {
            if (leg.modeOfTransport === 'car' || leg.modeOfTransport === 'foot') {
                return acc
            }
            return acc + leg.distance
        }, 0)
    }

    /**
     * Finds the best trips according to given criteria
     */
     public findBestTrips(): TripResult[] {
        if (this.bestTripsCandidates.length <= 1) {
            return this.bestTripsCandidates
        }
        let tripsWithScores: {trip: TripDecision, score: number}[] = []

        let tripRankings: TripDecision[] = []
        for (let i = 0; i < this.bestTripsCandidates.length; i++) {
            const delaySum = this.bestTripsCandidates[i].legs.reduce((acc, leg) => {
                // If possible use current delay in the calculation
                if (leg.delays.currentDelay !== -1) {
                    return acc + leg.delays.currentDelay
                }
                return acc + leg.delays.averageDelay
            }, 0)

            const distanceRatio = this.getTotalPublicTransportDistance(this.bestTripsCandidates[i]) / this.bestTripsCandidates[i].totalDistance
            tripRankings.push(
                {
                    tripIndex: i,
                    totalTime: this.bestTripsCandidates[i].totalTime / 60,
                    totalTransfers: this.bestTripsCandidates[i].totalTransfers,
                    totalEmissions: this.bestTripsCandidates[i].totalEmissions,
                    totalDelay: delaySum,
                    publicTransportDistanceToTotalDistanceRatio: distanceRatio,
                    isDelayCritical: this.hasCriticalDelay(this.bestTripsCandidates[i]),
                    totalTimeNormalized: 0,
                    totalTransfersNormalized: 0,
                    totalEmissionsNormalized: 0,
                    totalDelayNormalized: 0,
                    publicTransportDistanceToTotalDistanceRatioNormalized: 0
                } as TripDecision
            )
        }
        tripRankings = this.getParetoOptimalTrips(tripRankings)
        this.normalizeCriteria(tripRankings)
        tripsWithScores = tripRankings.map((val) => (
            {
                trip: val,
                score: val.totalTimeNormalized * this.weights[0] + val.totalEmissionsNormalized * this.weights[1] + val.totalDelayNormalized * this.weights[2] + val.totalTransfersNormalized * this.weights[3] + val.publicTransportDistanceToTotalDistanceRatioNormalized * this.weights[4]
            }))

        tripsWithScores.sort((a, b) => a.score - b.score)

        // Get 10 best solutions
        const bestTrips = tripsWithScores.map((val) => this.bestTripsCandidates[val.trip.tripIndex]).slice(0, 10)
        bestTrips[0].bestOverall = true
        this.flagTheBestTimeAndConsumption(bestTrips)
        return bestTrips
    }
}
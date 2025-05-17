/**
 * @file TripDecision.ts
 * @brief File that contains a type for trip that is used when
 * calculating which trips are the best
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

export type TripDecision = {
    tripIndex: number,
    totalTime: number,
    totalTransfers: number,
    totalEmissions: number,
    totalDelay: number,
    totalTimeNormalized: number,
    totalEmissionsNormalized: number,
    totalTransfersNormalized: number,
    totalDelayNormalized: number
}
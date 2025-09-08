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
    isDelayCritical: boolean, // If the delay is so big that next leg would be missed because of that
    totalTimeNormalized: number,
    totalEmissionsNormalized: number,
    totalTransfersNormalized: number,
    totalDelayNormalized: number,
    publicTransportDistanceToTotalDistanceRatio: number,
    publicTransportDistanceToTotalDistanceRatioNormalized: number,
}
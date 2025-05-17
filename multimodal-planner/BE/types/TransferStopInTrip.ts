/**
 * @file TransferStopInTrip.ts
 * @brief File that contains the definition of type used in returnTrips.ts to
 * identify transfer stop already used in a trip
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

export type TransferStopInTrip = {
    name: string,
    coords: [number, number],
}
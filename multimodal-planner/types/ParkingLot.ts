/**
 * @file ParkingLot.ts
 * @brief Defines the properties that a parking lot has
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */


export type ParkingLot = {
    polygon: [number, number][]
    capacity?: number
}

export type ParkingLotKeys = 'capacity'
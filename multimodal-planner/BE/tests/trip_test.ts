import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect";
import { carTrip1, carTrip1CorrectResult, publicTransportTrip1, publicTransportTrip1CorrectResult,
        carTripResultToMerge, publicTransportTripResultToMerge, correctMergedTrip, carTripAfterPublicTransport,
    correctMergedTripPickup, correctMergedTripReverseReturn, correctMergedPublicTransportTripPickup, publicTransportTripResultPickup} from "./data/testTrips.ts";
import {
    calculateTotalNumberOfTransfers,
    convertOTPDataToTripResult,
    mergeCarWithPublicTransport,
    mergeFinalTripWithCar
} from "../routeCalculator.ts";
import {TripResult} from "../../types/TripResult.ts";

describe("Check if OTPTrip is correctly converted to TripResult type", () => {
    it("Convert car OTPTrip to TripResult", async () => {
        const carTrip1Result: TripResult = await convertOTPDataToTripResult(carTrip1)
        expect(carTrip1Result).toEqual(carTrip1CorrectResult)
    })

    it("Convert public transport OTPTrip to TripResult", async () => {
        const publicTransportTrip1Result: TripResult = await convertOTPDataToTripResult(publicTransportTrip1)
        expect(publicTransportTrip1Result).toEqual(publicTransportTrip1CorrectResult)
    })
})

describe("Check if merging car trip and public transport trip is correct", () => {
    it("Merge car trip and public transport trip", () => {
        const mergedTrip = mergeCarWithPublicTransport(carTripResultToMerge, publicTransportTripResultToMerge, "Valašské Meziříčí")
        expect(mergedTrip).toEqual(correctMergedTrip)
    })

    it("Merge car public transport trip with pickup car", () => {
        // Merge car + public transport + pickup car
        const mergedTrip = mergeFinalTripWithCar(correctMergedTrip, carTripAfterPublicTransport, false)
        expect(mergedTrip).toEqual(correctMergedTripPickup)
    })

    it("Merge public transport trip with car trip with returning back", () => {
        // Merge public transport + car
        const mergedTrip = mergeFinalTripWithCar(publicTransportTripResultToMerge, carTripAfterPublicTransport, true)
        expect(mergedTrip).toEqual(correctMergedTripReverseReturn)
    })

    it("Merge public transport trip with pickup car", () => {
        // Merge public transport + pickup car
        const mergedTrip = mergeFinalTripWithCar(publicTransportTripResultPickup, carTripAfterPublicTransport, false)
        expect(mergedTrip).toEqual(correctMergedPublicTransportTripPickup)
    })

})

describe("Check if number of transfers is calculated correctly", () => {
    it("Trip with only car returns 0 transfers", () => {
        const transfers = calculateTotalNumberOfTransfers(carTrip1)
        expect(transfers).toBe(0)
    })

    it("Public transport trip with 2 legs returns 1 transfer", () => {
        const transfers = calculateTotalNumberOfTransfers(publicTransportTrip1)
        expect(transfers).toBe(1)

    })
})
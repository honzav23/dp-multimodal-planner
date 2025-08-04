import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect";
import {extractTags, handleFees, handleMaxStay} from "../parkingLotsNearby.ts";
import { parkingLotNoTags, parkingLotAllTags, correctParkingLotAllTags, parkingLotWithConditions, correctParkingLotsWithConditions } from "./data/parkingLots.ts";
import {ParkingLot} from "../../types/ParkingLot.ts";
import {parseConditionalRestrictions} from "osm-conditional-restrictions";

describe("Check if extracting parking lot information works correctly", () => {
    it("Parking lot with no tags returns nothing", () => {
        const parkingLotObj: Partial<ParkingLot> = {}
        extractTags(parkingLotNoTags, parkingLotObj)
        expect(Object.keys(parkingLotObj).length).toBe(0)
    })
    it("Parking lot with tags returns only tags necessary for a parking lot", () => {
        const parkingLotObj: Partial<ParkingLot> = {}
        extractTags(parkingLotAllTags, parkingLotObj)
        expect(parkingLotObj).toEqual(correctParkingLotAllTags)
    })
})

describe("Check if parking lot fee conditions are parsed correctly", () => {
    it("Fee with no condition", () => {
        const conditions = parseConditionalRestrictions('fee', parkingLotWithConditions.tags!)
        const feeConditions = handleFees(conditions)
        expect(feeConditions).toEqual(correctParkingLotsWithConditions.fee)
    })
})

describe("Check if parking lot max stay is parsed correctly", () => {
    const conditions = parseConditionalRestrictions('maxstay', parkingLotWithConditions.tags!)
    const maxStayConditions = handleMaxStay(conditions)
    expect(maxStayConditions).toEqual(correctParkingLotsWithConditions.maxStay)
})
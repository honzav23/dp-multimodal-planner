import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect";
import { validateRequestInput, validateCoordinates, validateDateAndTime, validatePreferences, validateTransferStop } from "../validate.ts";
import { trip, transferStop } from "./data/testTrip.ts";
import {TransferStop} from "../../types/TransferStop.ts";

describe("Validate trip request", () => {
  it("Doesn't throw when request is correct", () => {
    const testTrip = {...trip}
    let result = validateRequestInput(testTrip);
    expect(result.error).toBe(false);

    testTrip.preferences.transferStop = {...transferStop}
    result = validateRequestInput(testTrip);
    expect(result.error).toBe(false);
  })

  it("Validates coordinates", () => {
    const invalidCoordinates: any = [[42, 42, 42], "asdadda", [360, 16]]

    for (const coord of invalidCoordinates) {
      const result = validateCoordinates(coord);
      expect(result.error).toBe(true);
      expect(result.message).toBe("Invalid coordinates");
    }

    const validCoordinates = [[-90, -180], [0, 0], [42.1818, 16.456], [0, 180], [-90, 0]]
    for (const coord of validCoordinates) {
      const result = validateCoordinates(coord);
      expect(result.error).toBe(false);
    }
  })

  it("Validates date and time", () => {
    const errorMessage = "Invalid date or time";

    let invalidDates = ["25", "dasda", "2025-21-21", "2025-a-2"]
    for (let d of invalidDates) {
      const result = validateDateAndTime(d, "17:00:00");
      expect(result.error).toBe(true);
      expect(result.message).toBe(errorMessage);
    }

    const invalidTimes = ["25", "dasda", "33:17"]

    for (let t of invalidTimes) {
      const result = validateDateAndTime("2025-03-02", t);
      expect(result.error).toBe(true);
      expect(result.message).toBe(errorMessage);
    }

    const validDatesAndTimes = [["2025-03-02", "17:00:00"], ["2025-12-21", "09:20:00"], ["2025-12-21", "9:20:00"], ["2025-03-02", "23:59:59"]]

    for (const dt of validDatesAndTimes) {
      const result = validateDateAndTime(dt[0], dt[1]);
      expect(result.error).toBe(false);
    }
  })

  it("Validates trip preferences", () => {
    let preferences: Record<string, any> = {
      minimizeTransfers: true,
      findBestTrip: true
    }
    let result = validatePreferences(preferences);
    expect(result.error).toBe(true);
    expect(result.message).toBe("Missing required fields for preferences");

    preferences = {...trip.preferences};

    preferences.minimizeTransfers = 29;
    preferences.findBestTrip = "string";
    result = validatePreferences(preferences);
    expect(result.error).toBe(true);
    expect(result.message).toBe('Invalid type of one or more trip preferences');

  })

  it("Validates transfer stop", () => {
    let invalidTransferStop: Record<string, any> = {
      stopId: "string",
      stopName: "string",
      hasParking: true
    }

    let result = validateTransferStop(invalidTransferStop)
    expect(result.error).toBe(true);
    expect(result.message).toBe("Missing required fields for transfer stop");

    invalidTransferStop = {...transferStop, stopId: 25, stopName: true};
    result = validateTransferStop(invalidTransferStop)
    expect(result.error).toBe(true);
    expect(result.message).toBe('Invalid type of one or more transfer stop properties');

    invalidTransferStop = {...transferStop, stopCoords: [29, "sda"]};
    result = validateTransferStop(invalidTransferStop)
    expect(result.error).toBe(true);
    expect(result.message).toBe('Invalid coordinates');

    const validTransferStop = {...transferStop}
    result = validateTransferStop(validTransferStop)
    expect(result.error).toBe(false);
  })

})

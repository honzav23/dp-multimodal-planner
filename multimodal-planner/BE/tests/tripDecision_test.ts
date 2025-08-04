/**
 * @file tripDecision_test.ts
 * @brief This file deals with testing pareto optimality
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect";
import { getParetoOptimalTrips, hasCriticalDelay } from "../transferStopSelector.ts";
import { tripsParetoOneOptimal, tripsParetoMoreOptimal } from "./data/testTripRequest.ts";
import {
  publicTransportTrip1CorrectResult,
  publicTransportTrip1CorrectResultWithDelay,
  publicTransportTripWithWalkNoDelay,
  publicTransportTripWithWalkWithDelay
} from "./data/testTrips.ts";

describe("Check if making pareto queue is correct", () => {
  it("One pareto optimal solution", () => {
    const optimalTrips = getParetoOptimalTrips(tripsParetoOneOptimal)
    expect(optimalTrips.length).toBe(1)
    expect(optimalTrips[0].tripIndex).toBe(3)
  })
  it("Multiple pareto optimal solutions", () => {
    const optimalTrips = getParetoOptimalTrips(tripsParetoMoreOptimal)
    expect(optimalTrips.length).toBe(3)
    expect(optimalTrips[0].tripIndex).toBe(0)
    expect(optimalTrips[1].tripIndex).toBe(2)
    expect(optimalTrips[2].tripIndex).toBe(3)

  })
})

describe("Check if function evaluating critical delay is correct", () => {
  it("Return false when delay for trip without walking is 0", () => {
    expect(hasCriticalDelay(publicTransportTrip1CorrectResult)).toBeFalsy()
  })

  it("Return true when delay for trip without walking is so big that another leg is missed", () => {
    expect(hasCriticalDelay(publicTransportTrip1CorrectResultWithDelay)).toBeTruthy()
  })

  it("Return false when delay for trip with walking is 0", () => {
    expect(hasCriticalDelay(publicTransportTripWithWalkNoDelay)).toBeFalsy()
  })

  it("Return true when delay for trip with walking is so big that another leg is missed", () => {
    expect(hasCriticalDelay(publicTransportTripWithWalkWithDelay)).toBeTruthy()
  })
})

/**
 * @file tripDecision_test.ts
 * @brief This file deals with testing pareto optimality
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { describe, it } from "jsr:@std/testing/bdd"
import { assertEquals } from "jsr:@std/assert"
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
    assertEquals(optimalTrips.length, 1)
    assertEquals(optimalTrips[0].tripIndex, 3)
  })
  it("Multiple pareto optimal solutions", () => {
    const optimalTrips = getParetoOptimalTrips(tripsParetoMoreOptimal)
    assertEquals(optimalTrips.length, 3)
    assertEquals(optimalTrips[0].tripIndex, 0)
    assertEquals(optimalTrips[1].tripIndex, 2)
    assertEquals(optimalTrips[2].tripIndex, 3)

  })
})

describe("Check if function evaluating critical delay is correct", () => {
  it("Return false when delay for trip without walking is 0", () => {
    assertEquals(hasCriticalDelay(publicTransportTrip1CorrectResult), false)
  })

  it("Return true when delay for trip without walking is so big that another leg is missed", () => {
    assertEquals(hasCriticalDelay(publicTransportTrip1CorrectResultWithDelay), true)
  })

  it("Return false when delay for trip with walking is 0", () => {
    assertEquals(hasCriticalDelay(publicTransportTripWithWalkNoDelay), false)
  })

  it("Return true when delay for trip with walking is so big that another leg is missed", () => {
    assertEquals(hasCriticalDelay(publicTransportTripWithWalkWithDelay), true)
  })
})

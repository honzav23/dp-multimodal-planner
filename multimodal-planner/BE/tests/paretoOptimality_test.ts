/**
 * @file paretoOptimality_test.ts
 * @brief This file deals with testing pareto optimality
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { describe, it } from "jsr:@std/testing/bdd"
import { expect } from "jsr:@std/expect";
import { getParetoOptimalTrips } from "../transferStopSelector.ts";
import { tripsParetoOneOptimal, tripsParetoMoreOptimal } from "./data/testTrip.ts";

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

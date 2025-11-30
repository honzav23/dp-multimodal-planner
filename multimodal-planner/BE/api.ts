/**
 * @file api.ts
 * @brief Entrypoint for backend, api endpoints and things that run
 * when the server starts, are defined here
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { Hono } from '@hono/hono';
import { cors } from '@hono/hono/cors';
import { validateRequestInput } from './validate.ts';
import { calculateRoutes } from "./routeCalculator.ts";
import { fetchParkingLots } from './parkingLotsNearby.ts'
import type { TripRequest } from "../types/TripRequest.ts";
import type { TransferStop } from "../types/TransferStop.ts";
import type { ResultStatus } from "../types/ResultStatus.ts";
import { getTripsForLines, correctDateTimes, parseArguments } from "./common/common.ts";
import { getTransferStops } from "./common/otpRequests.ts";
import { KordisWebSocketManager } from './common/realtimeVehicleInfoProcessing.ts';
import type { LissyObj } from "./types/LissyTypes.ts";
import { WazeManager } from "./wazeManager.ts";
import { appLogger } from "./logger.ts";
import {BoundingBox} from "../types/BoundingBox.ts";

export const rootDir = import.meta.dirname;

const app = new Hono();

let apiUrl = "";
if (Deno.env.get("API_BASE_URL")) {
  apiUrl = Deno.env.get("API_BASE_URL") || '';
}

// Define who can make requests to this server and which methods are allowed
app.use(`${apiUrl}/api/*`, cors({
  origin: Deno.env.get("CORS_ORIGIN")!,
  allowMethods: ['POST', 'GET']
}));

// Main endpoint which gets the best trips based on the request
app.post(`${apiUrl}/api/calculateTrips`, async (request) => {
  const tripRequest = await request.req.json();
  const inputValidationResult: ResultStatus = validateRequestInput(tripRequest);
  if (inputValidationResult.error) {
    return request.json({ error: inputValidationResult.message }, 400);
  }
  const validTripRequest = tripRequest as TripRequest;
  correctDateTimes(validTripRequest);

  try {
    const response = await calculateRoutes(validTripRequest);
    return request.json(response);
  }
  catch (error) {
    appLogger.error("{error}", { error });
    return request.json({ outboundTrips: [], returnTrips: [] }, 500);
  }
});

// Endpoint that gets all available transfer stops
app.get(`${apiUrl}/api/transferStops`, (request) => {
  return request.json(transferStops);
});

app.get(`${apiUrl}/api/boundingBox`, (request) => {
  const boundingBox: BoundingBox = {
    minX: 15.538767,
    minY: 48.616718,
    maxX: 17.645923,
    maxY: 49.633254,
  }
  return request.json(boundingBox);
})

app.post(`${apiUrl}/api/parkingLotsNearby`, async (request) => {
  const body = await request.req.json();
  try {
    const parkingLots = await fetchParkingLots(body.stopId)
    return request.json(parkingLots);
  }
  catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      appLogger.error("Request for parking lots timed out");
    }
    return request.json([], 500);
  }
})

app.notFound((request) => {
  return request.json({ error: 'Not Found' }, 404);
})

export let transferStops: TransferStop[] = [];
export let lissyInfo: LissyObj = { availableTripsByLines: [], availableDates: [] }

// Run only when the server starts, not in tests
if (import.meta.main) {
  // Get all transfer stops and trips that include delay information when the server starts
  transferStops = await getTransferStops();
  lissyInfo = await getTripsForLines()

  const externalGTFS = parseArguments()
  const wazeManager = WazeManager.getInstance(Deno.env.get("WAZE_URL"));

  // No need to wait for the data
  wazeManager.startFetchingWazeData()

  if (!externalGTFS) {
    const kordisManager = KordisWebSocketManager.getInstance()
    kordisManager.connectToKordisWebSocket();
    await kordisManager.createConversionTable()
  }
  Deno.serve(app.fetch);
}



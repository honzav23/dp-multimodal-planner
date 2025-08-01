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
import { TripRequest } from "./types/TripRequest.ts";
import { ResultStatus } from "../types/ResultStatus.ts";
import { getTransferStops, getTripsForLines, convert12HourTo24Hour, parseArguments } from "./common/common.ts";
import { connectToKordisWebSocket, createConversionTable } from './common/realtimeVehicleInfoProcessing.ts';

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
  const body = await request.req.json();
  const inputValidationResult: ResultStatus = validateRequestInput(body);
  if (inputValidationResult.error) {
    return request.json({ error: inputValidationResult.message }, 400);
  }

  // Creating tripRequest object which is then used in calculateRoutes
  const tripRequest: TripRequest = {
    origin: body.origin,
    destination: body.destination,
    departureDateTime: `${body.departureDate}T${convert12HourTo24Hour(body.departureTime)}`,
    preferences: {
      modeOfTransport: body.preferences.modeOfTransport,
      useOnlyPublicTransport: body.preferences.useOnlyPublicTransport,
      transferStop: body.preferences.transferStop,
      findBestTrip: body.preferences.findBestTrip,
      pickupCoords: body.preferences.pickupCoords,
      comingBack: body.preferences.comingBack === null ? null :
          { returnDateTime: `${body.preferences.comingBack.returnDate}T${convert12HourTo24Hour(body.preferences.comingBack.returnTime)}` },
    }
  }
  try {
    const response = await calculateRoutes(tripRequest);
    return request.json(response);
  }
  catch (error) {
    console.log(error);
    return request.json({ outboundTrips: [], returnTrips: [] }, 500);
  }
});

// Endpoint that gets all available transfer stops
app.get(`${apiUrl}/api/transferStops`, (request) => {
  return request.json(transferStops);
});

app.post(`${apiUrl}/api/parkingLotsNearby`, async (request) => {
  const body = await request.req.json();
  const parkingLots = await fetchParkingLots(body.stopId)
  return request.json(parkingLots);
})

app.notFound((request) => {
  return request.json({ error: 'Not Found' }, 404);
})

// Get all transfer stops and trips that include delay information when the server starts
export const transferStops = await getTransferStops();
export const {availableTripsByLines, availableDates} = await getTripsForLines()

const externalGTFS = parseArguments()

if (!externalGTFS) {
  connectToKordisWebSocket();
  await createConversionTable()
}

Deno.serve(app.fetch);

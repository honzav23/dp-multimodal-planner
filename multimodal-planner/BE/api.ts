import { Hono } from '@hono/hono';
import { cors } from '@hono/hono/cors';
import { validateRequestInput } from './validate.ts';
import { calculateRoutes } from "./routeCalculator.ts";
import { TripRequest } from "./types/TripRequest.ts";
import { ResultStatus } from "../types/ResultStatus.ts";
import { getTransferStops, getTripsForLines } from "./common/common.ts";

const app = new Hono();

// Define who can make requests to this server and which methods are allowed
app.use('/api/*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['POST', 'GET']
}));

app.post('/api/route', async (request) => {
  const body = await request.req.json();
  const inputValidationResult: ResultStatus = validateRequestInput(body);
  if (inputValidationResult.error) {
    return request.json({ error: inputValidationResult.message }, 400);
  }

  const tripRequest: TripRequest = {
    origin: body.origin,
    destination: body.destination,
    departureDateTime: `${body.departureDate}T${body.departureTime}`,
    preferences: {
      modeOfTransport: body.preferences.modeOfTransport,
      transferStop: body.preferences.transferStop,
      minimizeTransfers: body.preferences.minimizeTransfers,
      findBestTrip: body.preferences.findBestTrip,
      pickupCoords: body.preferences.pickupCoords,
      comingBack: body.preferences.comingBack === null ? null :
          { returnDateTime: `${body.preferences.comingBack.returnDate}T${body.preferences.comingBack.returnTime}` },
    }
  }
  try {
    const response = await calculateRoutes(tripRequest);
    return request.json(response);
  }
  catch (error) {
    console.log(error);
    return request.json([], 500);
  }
});

app.get('/api/transferStops', (request) => {
  return request.json(transferStops);
});

app.notFound((request) => {
  return request.json({ error: 'Not Found' }, 404);
})

export const transferStops = await getTransferStops();
export const availableTripsForEachLine = await getTripsForLines()

Deno.serve(app.fetch);

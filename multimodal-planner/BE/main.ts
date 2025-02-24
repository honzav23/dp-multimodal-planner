import { Hono } from '@hono/hono';
import { cors } from '@hono/hono/cors';
import { validateRequestInput } from './validate.ts';
import { calculateRoad } from "./routeCalculator.ts";
import { TripRequest } from "./types/TripRequest.ts";
import { ResultStatus } from "../types/ResultStatus.ts";
import { getTransferStops } from "./common/common.ts";

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
    departureDate: `${body.departureDate}T${body.departureTime}`,
    preferences: {
      modeOfTransport: body.preferences.modeOfTransport,
      transferStop: body.preferences.transferStop,
      minimizeTransfers: body.minimizeTransfers
    }
  }
  const response = await calculateRoad(tripRequest);
  return request.json(response);
});

app.get('/api/transferStops', (request) => {
  return request.json(transferStops);
});

app.notFound((request) => {
  return request.json({ error: 'Not Found' }, 404);
})

export const transferStops = await getTransferStops();

Deno.serve(app.fetch);

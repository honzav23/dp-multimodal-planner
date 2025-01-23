import { Hono } from '@hono/hono';
import { cors } from '@hono/hono/cors';
import { validateRequestInput } from './validate.ts';
import { calculateRoad } from "./routeCalculator.ts";
import { TripRequest } from "./types/TripRequest.ts";
import { ResultStatus } from "./types/ResultStatus.ts";
import { getTransferStops } from "./common/common.ts";

const app = new Hono();

app.use('/api/*', cors({
  origin: 'http://localhost:3000',
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
    departureDate: `${body.departureDate}T${body.departureTime}`
  }
  calculateRoad(tripRequest);
  // console.log(transferPoints.length)
  return request.text('Hello World');
});

app.notFound((request) => {
  return request.json({ error: 'Not Found' }, 404);
})

export const transferPoints = getTransferStops();

Deno.serve(app.fetch);

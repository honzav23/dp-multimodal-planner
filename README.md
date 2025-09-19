# CarPub
---
CarPub is an application created as a master thesis by Jan Václavík which creates trips combining car and public transport mainly for South Moravian Region. It is aimed at users that commute to work on daily basis and want to utilize the speed and flexibility of a car with the comfort and eco-friendliness of public transport. 

This app uses 3 other services under the hood:
- GTFS files from [data Brno](https://data.brno.cz/) to get the latest timetable,
- [OpenTripPlanner 2 (OTP 2)](https://docs.opentripplanner.org/en/latest/) for creating scheduled trips,
- [Lissy](https://pclazur.fit.vutbr.cz/lissy) for getting routes and delays for given trips. CarPub works without Lissy as well but without accurate routes and delays.

---
## Requirements
- `NodeJS >= 20.0`,
- `Deno >= 2.2.11`,
- `Python >= 3.11`,
- `Docker` (optional)
---

## How to run
There are several options to run the app, with or without docker, in dev mode or in production mode.

**Necessary .env files must be created before running the app!!**

Backend and frontend parts consist of two files which are `.env.dev` and `.env.prod`. Either of these can be used for your specific use case.

Backend `.env` files include these variables:
- `OTP_URL` -- url for the OTP server for managing the trip requests,
- `LISSY_API_KEY` -- if not provided, API calls to Lissy will be skipped
- `LISSY_API_URL` -- if not provided, API calls to Lissy will be skipped,
- `CORS_ORIGIN` -- for development mode it is `http://localhost:5173`
- `WAZE_URL` -- url for getting current traffic information, if not provided no traffic info will be shown

Frontend `.env` files have only `VITE_BACKEND_URL` which is the url for backend. It is `http://localhost:8000/api` for dev mode.

---

## Development mode, no Docker

### Preparation
1. Clone the repository.
2. Go to `/multimodal-planner/BE`.
3. Run `deno install` to install necessary packages for backend.
4. Run `pip install -r requirements.txt` to install necessary Python packages.
5. Go to `/multimodal-planner/FE`.
6. Run `npm install` to install necessary packages.

---

### Launching
1. Make sure your OTP instance is running somewhere (locally or somewhere else).
2. Run the `initServer.py` in `/multimodal-planner/BE/scripts` which extracts transfer stops from GTFS files, gets the information about parking lots nearby and runs the server (with this option skip step 3), `--skip` argument can skip fetching parking lots which might take some time. Or you can get the transfer stops by running `getTransferStops.py`
3. In `/multimodal-planner/BE` run the server by `deno task dev`. You can also alter `deno.json` by adding `--external-gtfs` after `api.ts`. This signalizes that different GTFS files than South Moravian Region ones are used and will disable calls to Lissy.
4. In `/multimodal-planner/FE` run the client by `npm start`.

---

## Development mode, Docker used.
1. Make sure your OTP instance is running somewhere (locally or somewhere else).
2. In `dp-multimodal-planner` run `docker compose -f docker-compose-dev.yml`. Backend might take a few minutes to start working because initializing script which gets the information about parking lots nearby is launched.
    **Note: `.env.dev` files are used.**

---

## Production with Docker
1. Make sure your OTP instance is running somewhere (locally or somewhere else).
2. In `dp-multimodal-planner` run `docker compose -f docker-compose-prod.yml`. Backend might take a few minutes to start working because initializing script which gets the information about parking lots nearby is launched.
    **Note: `.env.prod` files are used.**




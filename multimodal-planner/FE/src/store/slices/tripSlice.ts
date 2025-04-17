/**
 * @brief Slice for managing trip requests in the application.
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @module tripRequestSlice
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';
import type { TripRequest } from '../../types/TripRequest';
import type { TransferStop } from '../../../../types/TransferStop';
import type { TripResponse } from "../../../../types/TripResult";
// @ts-ignore
import polyLine from "@mapbox/polyline"
import axios from 'axios';
import type {TransportMode} from "../../../../types/TransportMode";

export interface TripSliceState {
    tripRequest: TripRequest;
    tripResults: TripResponse;
    isLoading: boolean;
    openSnackbar: boolean;
    snackbarMessage: string;

    // Decoded routes for each leg of each trip
    routes: {
        outboundDecodedRoutes: {mode: TransportMode, route: LatLngTuple[]}[][],
        returnDecodedRoutes: {mode: TransportMode, route: LatLngTuple[]}[][]
    }
    selectedTrip: number
}

export const initialCoords: LatLngTuple = [1000, 1000]

const initialState: TripSliceState = {
    tripRequest: {
        origin: initialCoords,
        destination: initialCoords,
        departureDate: getFormattedDate(),
        departureTime: (new Date()).toLocaleTimeString(),
        preferences: {
            modeOfTransport: [],
            transferStop: null,
            minimizeTransfers: false,
            findBestTrip: false,
            pickupCoords: initialCoords,
            comingBack: null,
        }
    },
    tripResults: {
        outboundTrips: [],
        returnTrips: [],
    },
    routes: {
        outboundDecodedRoutes: [],
        returnDecodedRoutes: [],
    },
    selectedTrip: -1,
    isLoading: false,
    openSnackbar: false,
    snackbarMessage: '',
};

function getFormattedDate() {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

/**
 * Gets the most effective trips
 */
export const getTrips = createAsyncThunk('tripRequest/getRoutes', async (_, { getState }): Promise<TripResponse> => {
    const tripRequest = (getState() as { trip: TripSliceState }).trip.tripRequest;
    const response = await axios.post('http://localhost:8000/api/calculateTrips', tripRequest)

    return response.data
});

const tripSlice = createSlice({
    name: 'trip',
    initialState,
    reducers: {
        setStartCoords(state, action: PayloadAction<LatLngTuple>) {
            state.tripRequest.origin = action.payload;
        },
        setEndCoords(state, action: PayloadAction<LatLngTuple>) {
            state.tripRequest.destination = action.payload;
        },
        setPickupCoords(state, action: PayloadAction<LatLngTuple>) {
            state.tripRequest.preferences.pickupCoords = action.payload
        },
        setDepartureDate(state, action: PayloadAction<{year: number, month: number, day: number}>) {
            state.tripRequest.departureDate = `${action.payload.year}-${action.payload.month + 1}-${action.payload.day}`;
        },
        setDepartureTime(state, action: PayloadAction<string>) {
            state.tripRequest.departureTime = action.payload;
        },
        setTransferStop(state, action: PayloadAction<TransferStop | null>) {
            state.tripRequest.preferences.transferStop = action.payload;
        },
        closeSnackbar(state) {
          state.openSnackbar = false;
          state.snackbarMessage = '';
        },
        setSelectedTrip(state, action: PayloadAction<number>) {
            if (action.payload === state.selectedTrip) {
                state.selectedTrip = -1
            }
            else {
                state.selectedTrip = action.payload;
            }
        },
        setSelectedModeOfTransport(state, action: PayloadAction<TransportMode[] | null>) {
            if (action.payload === null) {
                state.tripRequest.preferences.modeOfTransport = []
            }
            else {
                state.tripRequest.preferences.modeOfTransport = action.payload
            }
        },
        setFindBestTrip(state, action: PayloadAction<boolean>) {
            state.tripRequest.preferences.findBestTrip = action.payload
        },
        clearTripsAndRoutes(state) {
            state.tripResults.outboundTrips = []
            state.tripResults.returnTrips = []
            state.routes.outboundDecodedRoutes = []
            state.routes.returnDecodedRoutes = []
            state.selectedTrip = -1
        },
        clearComingBackDateTime(state) {
          state.tripRequest.preferences.comingBack = null
        },
        setComingBackDate(state, action: PayloadAction<{year: number, month: number, day: number}>) {
            if (state.tripRequest.preferences.comingBack === null) {

                state.tripRequest.preferences.comingBack = {
                    returnDate: `${action.payload.year}-${action.payload.month + 1}-${action.payload.day}`,
                    returnTime: (new Date()).toLocaleTimeString()
                };
            }
            else {
                state.tripRequest.preferences.comingBack = {...state.tripRequest.preferences.comingBack, returnDate: `${action.payload.year}-${action.payload.month + 1}-${action.payload.day}`};
            }
        },
        setComingBackTime(state, action: PayloadAction<string>) {
            if (state.tripRequest.preferences.comingBack) {
                state.tripRequest.preferences.comingBack.returnTime = action.payload
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getTrips.pending, (state, action) => {
            state.isLoading = true;
        })
        builder.addCase(getTrips.fulfilled,(state, action) => {
            state.isLoading = false;

            // Clear the routes array from previous loads
            state.routes.outboundDecodedRoutes = []
            state.routes.returnDecodedRoutes = []
            state.tripResults = action.payload;
            if (state.tripResults.outboundTrips.length === 0) {
                state.openSnackbar = true;
                state.snackbarMessage = 'noTripsFound'
            }

            for (const tripResult of state.tripResults.outboundTrips) {
                const legs = tripResult.legs.map((leg) => (
                    {
                        mode: leg.modeOfTransport as TransportMode,
                        route: polyLine.decode(leg.route) as LatLngTuple[]
                    }
                ));
                state.routes.outboundDecodedRoutes.push(legs)
            }

            for (const tripResult of state.tripResults.returnTrips) {
                const legs = tripResult.legs.map((leg) => (
                    {
                        mode: leg.modeOfTransport as TransportMode,
                        route: polyLine.decode(leg.route) as LatLngTuple[]
                    }
                ));
                state.routes.returnDecodedRoutes.push(legs)
            }
        })
        builder.addCase(getTrips.rejected, (state, action) => {
            state.isLoading = false;
            state.openSnackbar = true;
            state.snackbarMessage = 'error'
        })
    }
});

export const { setStartCoords, setEndCoords, setDepartureDate,
            setDepartureTime, setTransferStop, closeSnackbar, setSelectedTrip, 
            setSelectedModeOfTransport, setFindBestTrip, clearTripsAndRoutes, setPickupCoords, clearComingBackDateTime,
            setComingBackTime, setComingBackDate } = tripSlice.actions;

export default tripSlice.reducer;
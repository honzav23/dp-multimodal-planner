/**
 * @file tripSlice.ts
 * @brief Slice for managing trip requests in the application.
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FormTripRequest } from '../../types/FormTripRequest.ts';
import type { TransferStop } from '../../../../types/TransferStop';
import type {
    TripResponse,
    TripResponseConvertedRoute,
    TripResultWithIdConvertedRoute
} from "../../../../types/TripResult";
import { decode } from '@googlemaps/polyline-codec'
import axios from 'axios';
import type {TransportMode} from "../../../../types/TransportMode";
import { openErrorSnackbar, openWarningSnackbar } from "./snackbarSlice.ts";
import {TripRequest} from "../../../../types/TripRequest.ts";

interface TripSliceState {
    tripRequest: FormTripRequest;
    tripResults: TripResponseConvertedRoute;
    isLoading: boolean;
    snackbarMessage: string;
    showOutboundTrips: boolean;
    showTripsSummary: boolean;
    selectedTrip: TripResultWithIdConvertedRoute | null;
}

export const initialCoords: [number, number] = [1000, 1000]

const initialState: TripSliceState = {
    tripRequest: {
        origin: initialCoords,
        destination: initialCoords,
        departureDate: getFormattedDate(),
        departureTime: (new Date()).toLocaleTimeString(),
        preferences: {
            modeOfTransport: [],
            showWazeEvents: true,
            useOnlyPublicTransport: false,
            transferStop: null,
            findBestTrip: false,
            pickupCoords: initialCoords,
            comingBack: null,
        }
    },
    showOutboundTrips: true,
    showTripsSummary: false,
    tripResults: {
        outboundTrips: [],
        returnTrips: [],
    },
    selectedTrip: null,
    isLoading: false,
    snackbarMessage: '',
};

function getFormattedDate() {
    const date = new Date();
    const paddedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const paddedDay = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Gets the most effective trips
 */
export const getTrips = createAsyncThunk('tripRequest/getRoutes', async (_, {dispatch, getState }): Promise<TripResponse> => {
    const tripRequest = (getState() as { trip: TripSliceState }).trip.tripRequest;
    const { departureDate, departureTime, preferences, ...rest } = tripRequest
    const { comingBack, ...restPreferences } = preferences
    const beTripRequest: TripRequest = {
        ...rest,
        departureDateTime: `${tripRequest.departureDate}T${tripRequest.departureTime}`,
        preferences: {
            ...restPreferences,
            comingBack: preferences.comingBack ? {
                returnDateTime: `${preferences.comingBack.returnDate}T${preferences.comingBack.returnTime}`
            } : null
        }
    }
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    try {
        const response = await axios.post(`${apiUrl}/calculateTrips`, beTripRequest)
        const data = response.data

        const tripsNotFound = data.outboundTrips.length === 0
        const returnTripsNotFound = data.returnTrips.length === 0 && tripRequest.preferences.comingBack

        if (tripsNotFound) {
            dispatch(openWarningSnackbar('noTripsFound'))
        }

        else if (returnTripsNotFound) {
            dispatch(openWarningSnackbar('noReturnTripsFound'))
        }
        else {
            dispatch(setShowTripsSummary(true))
        }
        return data
    }

    catch {
        dispatch(setShowTripsSummary(false))
        dispatch(openErrorSnackbar('tripError'))
        return { outboundTrips: [], returnTrips: [] }
    }

});

const tripSlice = createSlice({
    name: 'trip',
    initialState,
    reducers: {
        setStartCoords(state, action: PayloadAction<[number, number]>) {
            state.tripRequest.origin = action.payload;
        },
        setEndCoords(state, action: PayloadAction<[number, number]>) {
            state.tripRequest.destination = action.payload;
        },
        setPickupCoords(state, action: PayloadAction<[number, number]>) {
            state.tripRequest.preferences.pickupCoords = action.payload
        },
        setDepartureDate(state, action: PayloadAction<{year: number, month: number, day: number}>) {
            const paddedMonth = (action.payload.month + 1).toString().padStart(2, '0');
            const paddedDay = action.payload.day.toString().padStart(2, '0');
            state.tripRequest.departureDate = `${action.payload.year}-${paddedMonth}-${paddedDay}`;
        },
        setDepartureTime(state, action: PayloadAction<string>) {
            state.tripRequest.departureTime = action.payload;
        },
        setTransferStop(state, action: PayloadAction<TransferStop | null>) {
            state.tripRequest.preferences.transferStop = action.payload;
        },
        setSelectedTrip(state, action: PayloadAction<TripResultWithIdConvertedRoute | null>) {
            state.selectedTrip = action.payload;
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
        clearTrips(state) {
            state.showTripsSummary = false
            state.tripResults.outboundTrips = []
            state.tripResults.returnTrips = []
            state.selectedTrip = null
        },
        clearComingBackDateTime(state) {
          state.tripRequest.preferences.comingBack = null
        },
        setComingBackDate(state, action: PayloadAction<{year: number, month: number, day: number}>) {
            const paddedMonth = (action.payload.month + 1).toString().padStart(2, '0');
            const paddedDay = action.payload.day.toString().padStart(2, '0');
            if (state.tripRequest.preferences.comingBack === null) {
                
                state.tripRequest.preferences.comingBack = {
                    returnDate: `${action.payload.year}-${paddedMonth}-${paddedDay}`,
                    returnTime: (new Date()).toLocaleTimeString()
                };
            }
            else {
                state.tripRequest.preferences.comingBack = {...state.tripRequest.preferences.comingBack, returnDate: `${action.payload.year}-${paddedMonth}-${paddedDay}`};
            }
        },
        setComingBackTime(state, action: PayloadAction<string>) {
            if (state.tripRequest.preferences.comingBack) {
                state.tripRequest.preferences.comingBack.returnTime = action.payload
            }
        },
        setUseOnlyPublicTransport(state, action: PayloadAction<boolean>) {
            state.tripRequest.preferences.useOnlyPublicTransport = action.payload
        },
        setShowWazeEvents(state, action: PayloadAction<boolean>) {
            state.tripRequest.preferences.showWazeEvents = action.payload
        },
        setShowOutboundTrips(state, action: PayloadAction<boolean>) {
            state.showOutboundTrips = action.payload
        },
        setShowTripsSummary(state, action: PayloadAction<boolean>) {
            state.showTripsSummary = action.payload
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getTrips.pending, (state) => {
            state.isLoading = true;
        })
        builder.addCase(getTrips.fulfilled,(state, action) => {
            state.isLoading = false;
            state.tripResults.outboundTrips = action.payload.outboundTrips.map((trip) => {
                return {
                    ...trip,
                    legs: trip.legs.map((leg) => {
                        return {...leg, route: decode(leg.route, 5)}
                    }),
                }
            })

            state.tripResults.returnTrips = action.payload.returnTrips.map((trip) => {
                return {
                    ...trip,
                    legs: trip.legs.map((leg) => {
                        return {...leg, route: decode(leg.route, 5)}
                    }),
                }
            })
        })
    }
});

export const { setStartCoords, setEndCoords, setDepartureDate,
            setDepartureTime, setTransferStop, setSelectedTrip,
            setSelectedModeOfTransport, setFindBestTrip, clearTrips, setPickupCoords, clearComingBackDateTime,
            setComingBackTime, setComingBackDate, setUseOnlyPublicTransport, setShowOutboundTrips, setShowWazeEvents,
            setShowTripsSummary } = tripSlice.actions;

export default tripSlice.reducer;
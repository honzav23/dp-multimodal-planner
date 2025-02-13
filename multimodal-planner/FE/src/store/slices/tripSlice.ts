/**
 * @brief Slice for managing trip requests in the application.
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @module tripRequestSlice
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';
import type { TripRequest } from '../../types/TripRequest';
import type { TransferStop } from '../../../../types/TransferStop';
import type { TripResult } from "../../../../types/TripResult";
import axios from 'axios';

export interface TripSliceState {
    tripRequest: TripRequest;
    tripResults: TripResult[];
    isLoading: boolean;
    openSnackbar: boolean;
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
            minimizeTransfers: false
        }
    },
    tripResults: [],
    isLoading: false,
    openSnackbar: false
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
export const getTrips = createAsyncThunk('tripRequest/getRoutes', async (_, { getState }): Promise<TripResult[]> => {
    const tripRequest = (getState() as { trip: TripSliceState }).trip.tripRequest;
    const response = await axios.post('http://localhost:8000/api/route', tripRequest)

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
        setDepartureDate(state, action: PayloadAction<{year: number, month: number, day: number}>) {
            state.tripRequest.departureDate = `${action.payload.year}-${action.payload.month + 1}-${action.payload.day}`;
        },
        setDepartureTime(state, action: PayloadAction<string>) {
            state.tripRequest.departureTime = action.payload;
        },
        setTransferStop(state, action: PayloadAction<TransferStop | null>) {
            if (action.payload !== null) {
                state.tripRequest.preferences.transferStop = action.payload;
            }
        },
        closeSnackbar(state) {
          state.openSnackbar = false;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getTrips.pending, (state, action) => {
            state.isLoading = true;
        })
        builder.addCase(getTrips.fulfilled,(state, action) => {
            state.isLoading = false;
            state.tripResults = action.payload;
        })
        builder.addCase(getTrips.rejected, (state, action) => {
            state.isLoading = false;
            state.openSnackbar = true;
        })
    }
});

export const { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime, setTransferStop, closeSnackbar } = tripSlice.actions;

export default tripSlice.reducer;
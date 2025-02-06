/**
 * @brief Slice for managing trip requests in the application.
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @module tripRequestSlice
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';
import { TripRequest } from '../../types/TripRequest';
import { TransferStop } from '../../../../types/TransferStop';
import axios from 'axios';

export const initialCoords: LatLngTuple = [1000, 1000]

const initialState: TripRequest = {
    origin: initialCoords,
    destination: initialCoords,
    departureDate: getFormattedDate(),
    departureTime: (new Date()).toLocaleTimeString(),
    preferences: {
        modeOfTransport: null,
        transferStop: null,
        minimizeTransfers: false
    }
};

function getFormattedDate() {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

export const getRoutes = createAsyncThunk('tripRequest/getRoutes', async (_, { getState }) => {
    const tripRequest = (getState() as { tripRequest: TripRequest }).tripRequest
    const response = await axios.post('http://localhost:8000/api/route', tripRequest)
    return response
});

const tripRequestSlice = createSlice({
    name: 'tripRequest',
    initialState,
    reducers: {
        setStartCoords(state, action: PayloadAction<LatLngTuple>) {
            state.origin = action.payload;
        },
        setEndCoords(state, action: PayloadAction<LatLngTuple>) {
            state.destination = action.payload;
        },
        setDepartureDate(state, action: PayloadAction<{year: number, month: number, day: number}>) {
            state.departureDate = `${action.payload.year}-${action.payload.month + 1}-${action.payload.day}`;
        },
        setDepartureTime(state, action: PayloadAction<string>) {
            state.departureTime = action.payload;
        },
        setTransferStop(state, action: PayloadAction<TransferStop | null>) {
            if (action.payload !== null) {
                state.preferences.transferStop = action.payload;
            }
        }
    },
});

export const { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime, setTransferStop } = tripRequestSlice.actions;

export default tripRequestSlice.reducer;
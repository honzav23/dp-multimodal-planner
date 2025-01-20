import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';
import axios from 'axios';

interface TripRequest {
    origin: LatLngTuple;
    destination: LatLngTuple;
    departureDate: string;
    departureTime: string;
}

const initialState: TripRequest = {
    origin: [1000, 1000],
    destination: [1000, 1000],
    departureDate: getFormattedDate(),
    departureTime: (new Date()).toLocaleTimeString()
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
        }
    },
});

export const { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime } = tripRequestSlice.actions;

export default tripRequestSlice.reducer;
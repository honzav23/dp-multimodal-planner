import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';

interface TripRequest {
    startCoords: LatLngTuple;
    endCoords: LatLngTuple;
    departureDate: string;
    departureTime: string;
}

const initialState: TripRequest = {
    startCoords: [1000, 1000],
    endCoords: [1000, 1000],
    departureDate: (new Date()).toLocaleDateString(),
    departureTime: (new Date()).toLocaleTimeString()
};

const tripRequestSlice = createSlice({
    name: 'tripRequest',
    initialState,
    reducers: {
        setStartCoords(state, action: PayloadAction<LatLngTuple>) {
           state.startCoords = action.payload;
        },
        setEndCoords(state, action: PayloadAction<LatLngTuple>) {
            state.endCoords = action.payload;
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
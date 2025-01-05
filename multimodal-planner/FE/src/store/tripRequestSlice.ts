import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';

interface TripRequest {
    startCoords: LatLngTuple;
    endCoords: LatLngTuple;
}

const initialState: TripRequest = {
    startCoords: [1000, 1000],
    endCoords: [1000, 1000],
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
        }
    },
});

export const { setStartCoords, setEndCoords } = tripRequestSlice.actions;

export default tripRequestSlice.reducer;
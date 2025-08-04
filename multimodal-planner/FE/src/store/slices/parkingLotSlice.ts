import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {ParkingLot} from "../../../../types/ParkingLot.ts";
import { openErrorSnackbar, openWarningSnackbar } from "./snackbarSlice.ts";

interface ParkingLotState {
    parkingLots: ParkingLot[]
    parkingLotsLoading: boolean;
}

const initialState: ParkingLotState = {
    parkingLots: [],
    parkingLotsLoading: false,
};

/**
 * Get nearby parking lots for a given transfer stop
 */
export const getParkingLotsNearby = createAsyncThunk('transferStops/parkingLots',
    async (stopId: string, { dispatch }): Promise<ParkingLot[]> => {
        const apiUrl = import.meta.env.VITE_BACKEND_URL
        try {
            const response = await axios.post<ParkingLot[]>(`${apiUrl}/parkingLotsNearby`, { stopId })
            if (response.data.length === 0) {
                dispatch(openWarningSnackbar('noParkingLotsFound'))
            }
            return response.data;
        }

        catch {
            dispatch(openErrorSnackbar('parkingLotError'))
            return []
        }
    })

const parkingLotSlice = createSlice({
    name: 'parkingLots',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getParkingLotsNearby.pending, (state) => {
            state.parkingLotsLoading = true
        })
        builder.addCase(getParkingLotsNearby.fulfilled, (state, action) => {
            state.parkingLotsLoading = false
            state.parkingLots = action.payload
        })
        builder.addCase(getParkingLotsNearby.rejected, (state) => {
            state.parkingLotsLoading = false
        })
    },
});

export default parkingLotSlice.reducer;
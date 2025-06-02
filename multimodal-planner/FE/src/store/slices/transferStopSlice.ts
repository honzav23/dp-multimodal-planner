/**
 * @file transferStopSlice.ts
 * @brief Redux slice for managing transfer stops and selected transfer stop
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { TransferStop } from '../../../../types/TransferStop';
import {LatLngTuple} from "leaflet";
import {ParkingLot} from "../../../../types/ParkingLot.ts";

interface TransferStopState {
    transferStops: TransferStop[];
    selectedTransferStop: TransferStop | null;
    parkingLots: ParkingLot[]
    parkingLotsLoading: boolean;
}

const initialState: TransferStopState = {
    transferStops: [],
    selectedTransferStop: null,
    parkingLots: [],
    parkingLotsLoading: false,
};

/**
 * Get transfer stops from backend
 */
export const getTransferStops = createAsyncThunk(
    'transferStops/getTransferStops',
    async (): Promise<TransferStop[]> => {
        const apiUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await axios.get<TransferStop[]>(`${apiUrl}/transferStops`);
        return response.data;
    }
);

/**
 * Get nearby parking lots for a given transfer stop
 */
export const getParkingLotsNearby = createAsyncThunk('transferStops/parkingLots',
    async (stopId: string): Promise<ParkingLot[]> => {
        const apiUrl = import.meta.env.VITE_BACKEND_URL
        const response = await axios.post<ParkingLot[]>(`${apiUrl}/parkingLotsNearby`, { stopId })
        return response.data;
    })

const transferStopSlice = createSlice({
    name: 'transferStops',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getTransferStops.fulfilled, (state, action) => {
                state.transferStops = action.payload;
            })

        builder.addCase(getParkingLotsNearby.pending, (state) => {
            state.parkingLotsLoading = true
        })
        builder.addCase(getParkingLotsNearby.fulfilled, (state, action) => {
            state.parkingLotsLoading = false
            state.parkingLots = action.payload
        })
        builder.addCase(getParkingLotsNearby.rejected, (state, action) => {
            // TODO React somehow when rejected
            state.parkingLotsLoading = false
        })
    },
});

export default transferStopSlice.reducer;
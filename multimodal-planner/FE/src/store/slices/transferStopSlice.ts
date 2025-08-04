/**
 * @file transferStopSlice.ts
 * @brief Redux slice for managing transfer stops and selected transfer stop
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { TransferStop } from '../../../../types/TransferStop';
import {ParkingLot} from "../../../../types/ParkingLot.ts";
import {openErrorSnackbar} from "./snackbarSlice.ts";

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
    async (_, { dispatch }): Promise<TransferStop[]> => {
        const apiUrl = import.meta.env.VITE_BACKEND_URL;

        try {
            const response = await axios.get<TransferStop[]>(`${apiUrl}/transferStops`);
            return response.data;
        }
        catch {
            dispatch(openErrorSnackbar('transferStopsError'))
            return []
        }
    }
);

const transferStopSlice = createSlice({
    name: 'transferStops',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getTransferStops.fulfilled, (state, action) => {
                state.transferStops = action.payload;
        })
    },
});

export default transferStopSlice.reducer;
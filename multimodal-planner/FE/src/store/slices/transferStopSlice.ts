/**
 * @file transferStopSlice.ts
 * @brief Redux slice for managing transfer stops and selected transfer stop
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { TransferStop } from '../../../../types/TransferStop';

interface TransferStopState {
    transferStops: TransferStop[];
    selectedTransferStop: TransferStop | null;
}

const initialState: TransferStopState = {
    transferStops: [],
    selectedTransferStop: null,
};

export const getTransferStops = createAsyncThunk(
    'transferStops/getTransferStops',
    async () => {
        const apiUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await axios.get<TransferStop[]>(`${apiUrl}/transferStops`);
        return response.data;
    }
);

const transferStopSlice = createSlice({
    name: 'transferStops',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getTransferStops.fulfilled, (state, action) => {
                state.transferStops = action.payload;
            })
    },
});

export default transferStopSlice.reducer;
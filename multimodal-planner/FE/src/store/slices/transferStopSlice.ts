import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { TransferStop } from '../../../../types/TransferStop';
import { PayloadAction } from '@reduxjs/toolkit';

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
        const response = await axios.get<TransferStop[]>('http://localhost:8000/api/transferStops');
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
            // .addCase(fetchTransferStops.rejected, (state, action) => {
            //     state.loading = false;
            //     state.error = action.error.message || 'Failed to fetch transfer stops';
            // });
    },
});

export default transferStopSlice.reducer;
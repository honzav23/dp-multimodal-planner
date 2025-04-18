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
        const apiUrl = import.meta.env.VITE_BACKEND_URL;
        console.log(apiUrl)
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
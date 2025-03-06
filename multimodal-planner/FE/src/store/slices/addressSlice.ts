/**
 * @file addressSlice.ts
 * @brief This file contains the Redux slice for managing address-related state in the application.
 * It includes actions and asynchronous thunks for setting, clearing, and fetching addresses based on coordinates.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date 
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';

interface AddressState {
    startAddress: string | null;
    endAddress: string | null;
    pickupAddress: string | null
}

const initialState: AddressState = {
    startAddress: null,
    endAddress: null,
    pickupAddress: null
};

/**
 * Fetches the address of the given coordinates
 */
export const getAddress = createAsyncThunk('address/getAddress', async (params: {origin: string, coords: LatLngTuple}) => {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${params.coords[0]}&lon=${params.coords[1]}`)
    return {origin: params.origin, address: response.data.display_name}
});

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        clearStartAddress(state) {
            state.startAddress = null;
        },
        clearEndAddress(state) {
            state.endAddress = null;
        },
        clearPickupAddress(state) {
            state.pickupAddress = null
        },
        setStartAddress(state, action: PayloadAction<string>) {
            state.startAddress = action.payload
        },
        setEndAddress(state, action: PayloadAction<string>) {
            state.endAddress = action.payload
        },
        setPickupAddress(state, action: PayloadAction<string>) {
            state.pickupAddress = action.payload
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getAddress.rejected, (state, action) => {
            if (action.meta.arg.origin === 'start') {
                state.startAddress = '';
            }
            else if (action.meta.arg.origin === 'pickup') {
                state.pickupAddress = ''
            }
            else if (action.meta.arg.origin === 'end') {
                state.endAddress = '';
            }
        })
        .addCase(getAddress.fulfilled, (state, action) => {
            if (action.payload.origin === 'start')  {
                state.startAddress = action.payload.address;
            }
            else if (action.meta.arg.origin === 'pickup') {
                state.pickupAddress = action.payload.address
            }
            else if (action.meta.arg.origin === 'end') {
                state.endAddress = action.payload.address;
            }
        });
    }
});

export const { clearStartAddress, clearEndAddress, clearPickupAddress, setStartAddress, setEndAddress, setPickupAddress } = addressSlice.actions;

export default addressSlice.reducer;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';

interface AddressState {
    startAddress: string | null;
    endAddress: string | null;
}

const initialState: AddressState = {
    startAddress: null,
    endAddress: null,
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
        setStartAddress(state, action: PayloadAction<string>) {
            state.startAddress = action.payload
        },
        setEndAddress(state, action: PayloadAction<string>) {
            state.endAddress = action.payload
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getAddress.rejected, (state, action) => {
            if (action.meta.arg.origin === 'start') {
                state.startAddress = '';
            }
            else {
                state.endAddress = '';
            }
        })
        .addCase(getAddress.fulfilled, (state, action) => {
            if (action.payload.origin === 'start')  {
                state.startAddress = action.payload.address;
            }
            else {
                state.endAddress = action.payload.address;
            }
        });
    }
});

export const { clearStartAddress, clearEndAddress, setStartAddress, setEndAddress } = addressSlice.actions;

export default addressSlice.reducer;
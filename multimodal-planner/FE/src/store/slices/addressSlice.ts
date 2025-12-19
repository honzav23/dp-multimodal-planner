/**
 * @file addressSlice.ts
 * @brief This file contains the Redux slice for managing address-related state in the application.
 * It includes actions and asynchronous thunks for setting, clearing, and fetching addresses based on coordinates.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */
import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import axios from 'axios';
import {LatLngTuple} from 'leaflet';
import {openErrorSnackbar} from "./snackbarSlice.ts";
import {ResultStatus} from "../../../../types/ResultStatus.ts";
import {InputLocation} from '../../types/FormTripRequest.ts'
import {BoundingBox} from "../../../../types/BoundingBox.ts";

interface AddressState {
    startAddress: string;
    startAddressError: ResultStatus
    endAddress: string;
    endAddressError: ResultStatus
    pickupAddress: string
    pickupAddressError: ResultStatus,
    boundingBox: BoundingBox | null
}

const initialState: AddressState = {
    startAddress: '',
    startAddressError: { error: false, message: '' },
    endAddress: '',
    endAddressError: { error: false, message: '' },
    pickupAddress: '',
    pickupAddressError: { error: false, message: '' },
    boundingBox: null,
};

/**
 * Fetches the address of the given coordinates
 */
export const getAddress = createAsyncThunk('address/getAddress', async (params: {origin: InputLocation, coords: LatLngTuple}) => {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${params.coords[0]}&lon=${params.coords[1]}`)
    return {address: response.data.display_name}
});

/**
 * Fetches the bounding box
 */
export const getBoundingBox = createAsyncThunk('address/getBoundingBox', async () => {
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    const response = await axios.get<BoundingBox>(`${apiUrl}/boundingBox`)
    return response.data
});

export const getCoordinatesFromAddress = createAsyncThunk('address/getCoordinatesFromAddress', async (params: {address: string}, { dispatch }) => {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(params.address)}`)
        if (response.data.length === 0) {
            return []
        }
        const coords = [parseFloat(response.data[0].lat), parseFloat(response.data[0].lon)];
        return coords;
    }
    catch {
        dispatch(openErrorSnackbar("coordinatesError"))
        return []
    }
});

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        clearStartAddress(state) {
            state.startAddress = '';
        },
        clearEndAddress(state) {
            state.endAddress = '';
        },
        clearPickupAddress(state) {
            state.pickupAddress = ''
        },
        setStartAddress(state, action: PayloadAction<string>) {
            state.startAddress = action.payload
        },
        setPickupAddress(state, action: PayloadAction<string>) {
            state.pickupAddress = action.payload
        },
        setEndAddress(state, action: PayloadAction<string>) {
            state.endAddress = action.payload
        },
        setAddressError(state, action: PayloadAction<{ message: string, origin: InputLocation }>) {
            const errorObject: ResultStatus = { error: true, message: action.payload.message }
            if (action.payload.origin === InputLocation.START) {
                state.startAddressError = errorObject
            }
            else if (action.payload.origin === InputLocation.END) {
                state.endAddressError = errorObject
            }
            else {
                state.pickupAddressError = errorObject
            }
        },
        clearAddressError(state, action: PayloadAction<InputLocation>) {
            const errorObject: ResultStatus = { error: false, message: '' }
            if (action.payload === InputLocation.START) {
                state.startAddressError = errorObject
            }
            else if (action.payload === InputLocation.PICKUP) {
                state.pickupAddressError = errorObject
            }
            else {
                state.endAddressError = errorObject
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getAddress.rejected, (state, action) => {
            const coordsToString = `${action.meta.arg.coords[0].toFixed(5)} ${action.meta.arg.coords[1].toFixed(5)}`
            if (action.meta.arg.origin === InputLocation.START) {
                state.startAddress = coordsToString;
            }
            else if (action.meta.arg.origin === InputLocation.PICKUP) {
                state.pickupAddress = coordsToString
            }
            else {
                state.endAddress = coordsToString;
            }
        })
        .addCase(getAddress.fulfilled, (state, action) => {
            if (action.meta.arg.origin === InputLocation.START)  {
                state.startAddress = action.payload.address;
            }
            else if (action.meta.arg.origin === InputLocation.PICKUP) {
                state.pickupAddress = action.payload.address
            }
            else {
                state.endAddress = action.payload.address;
            }
        })
        .addCase(getBoundingBox.fulfilled, (state, action) => {
            state.boundingBox = action.payload
        })
        .addCase(getBoundingBox.rejected, (state) => {
            state.boundingBox = null
        })
    }
});

export const { clearStartAddress, clearEndAddress, clearPickupAddress, setStartAddress, setPickupAddress, setEndAddress,
    setAddressError, clearAddressError } = addressSlice.actions;

export default addressSlice.reducer;
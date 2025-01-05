import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { LatLngTuple } from 'leaflet';

interface FocusState {
    startInputFocused: boolean;
    endInputFocused: boolean;
}

const initialState: FocusState = {
    startInputFocused: false,
    endInputFocused: false
};

const inputFocusSlice = createSlice({
    name: 'focus',
    initialState,
    reducers: {
        setFocus(state, action: PayloadAction<{origin: string, focused: boolean}>) {
            if (action.payload.origin === 'start') {
                state.startInputFocused = action.payload.focused;
            }
            else {
                state.endInputFocused = action.payload.focused;
            }
        }
    }
});

export const { setFocus } = inputFocusSlice.actions;

export default inputFocusSlice.reducer;
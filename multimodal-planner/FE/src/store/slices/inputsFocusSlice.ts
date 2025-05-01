/**
 * @file inputFocusSlice.ts
 * @brief Redux slice for managing the focus state of input fields.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FocusState {
    startInputFocused: boolean;
    endInputFocused: boolean;
    pickupInputFocused: boolean
}

const initialState: FocusState = {
    startInputFocused: false,
    endInputFocused: false,
    pickupInputFocused: false
};

const inputFocusSlice = createSlice({
    name: 'focus',
    initialState,
    reducers: {
        setFocus(state, action: PayloadAction<{origin: string, focused: boolean}>) {
            if (action.payload.origin === 'start') {
                state.startInputFocused = action.payload.focused;
            }
            else if (action.payload.origin === 'pickup') {
                state.pickupInputFocused = action.payload.focused;
            }
            else if (action.payload.origin === 'end') {
                state.endInputFocused = action.payload.focused;
            }

            if (state.startInputFocused && action.payload.origin === "start") {
                state.endInputFocused = false
                state.pickupInputFocused = false
            }
            else if (state.pickupInputFocused && action.payload.origin === "pickup") {
                state.startInputFocused = false
                state.endInputFocused = false
            }
            else if (state.endInputFocused && action.payload.origin === "end") {
                state.startInputFocused = false
                state.pickupInputFocused = false
            }
        }
    }
});

export const { setFocus } = inputFocusSlice.actions;

export default inputFocusSlice.reducer;
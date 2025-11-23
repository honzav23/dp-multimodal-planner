/**
 * @file inputFocusSlice.ts
 * @brief Redux slice for managing the focus state of input fields.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {InputLocation} from '../../types/FormTripRequest.ts'

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
        setFocus(state, action: PayloadAction<{origin: InputLocation, focused: boolean}>) {
            if (action.payload.origin === InputLocation.START) {
                state.startInputFocused = action.payload.focused;
            }
            else if (action.payload.origin === InputLocation.PICKUP) {
                state.pickupInputFocused = action.payload.focused;
            }
            else {
                state.endInputFocused = action.payload.focused;
            }

            if (state.startInputFocused && action.payload.origin === InputLocation.START) {
                state.endInputFocused = false
                state.pickupInputFocused = false
            }
            else if (state.pickupInputFocused && action.payload.origin === InputLocation.PICKUP) {
                state.startInputFocused = false
                state.endInputFocused = false
            }
            else if (state.endInputFocused && action.payload.origin === InputLocation.END) {
                state.startInputFocused = false
                state.pickupInputFocused = false
            }
        }
    }
});

export const { setFocus } = inputFocusSlice.actions;

export default inputFocusSlice.reducer;
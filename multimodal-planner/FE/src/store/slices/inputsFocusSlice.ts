/**
 * @file inputFocusSlice.ts
 * @brief Redux slice for managing the focus state of input fields.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date 
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
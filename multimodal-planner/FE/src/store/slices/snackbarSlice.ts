/**
 * @file snackbarSlice.ts
 * @brief This file contains the Redux slice for managing snackbar including opening with various messages and types
 * and closing it
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SnackbarState {
    snackbarOpen: boolean;
    message: string;
    type: 'error' | 'warning'
}

const initialState: SnackbarState = {
    snackbarOpen: false,
    message: '',
    type: 'error',
}

const snackbarSlice = createSlice({
    name: 'snackbar',
    initialState,
    reducers: {
        openSnackbar: (state, action: PayloadAction<{message: string, type: 'error' | 'warning'}>) => {
            state.snackbarOpen = true;
            state.message = action.payload.message;
            state.type = action.payload.type;
        },
        closeSnackbar: (state) => {
            state.snackbarOpen = false;
            state.message = '';
            state.type = 'error';
        }
    }
})

export const { openSnackbar, closeSnackbar } = snackbarSlice.actions;

export default snackbarSlice.reducer;
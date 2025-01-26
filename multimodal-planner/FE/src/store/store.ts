import { configureStore } from '@reduxjs/toolkit';
import addressReducer from './slices/addressSlice';
import inputFocusReducer from './slices/inputsFocusSlice';
import tripRequestReducer from './slices/tripRequestSlice';
import transferStopReducer from './slices/transferStopSlice';

// const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const store = configureStore({
    reducer: {
        address: addressReducer,
        focus: inputFocusReducer,
        tripRequest: tripRequestReducer,
        transferStop: transferStopReducer,
    },
});

export default store;
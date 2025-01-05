import { configureStore } from '@reduxjs/toolkit';
import addressReducer from './addressSlice';
import inputFocusReducer from './inputsFocusSlice';
import tripRequestReducer from './tripRequestSlice';

// const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const store = configureStore({
    reducer: {
        address: addressReducer,
        focus: inputFocusReducer,
        tripRequest: tripRequestReducer,
    },
});

export default store;
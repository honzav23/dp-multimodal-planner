/**
 * @file index.tsx
 * @brief Main entry point for the app
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import store from './store/store';
import { Provider } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { theme } from './theme/theme';
import { ThemeProvider } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/cs.js';
import '@fontsource/inter'


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='cs'>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <App/>
        </ThemeProvider>
      </Provider>
    </LocalizationProvider>
  </React.StrictMode>
);

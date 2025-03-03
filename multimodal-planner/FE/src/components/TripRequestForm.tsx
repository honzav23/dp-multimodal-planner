/**
 * @file TripRequestForm.tsx
 * @brief Component for planning a trip, including input fields for start and end points, date and time pickers.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import { TextField, InputAdornment, IconButton, Button, Tooltip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import CloseIcon from '@mui/icons-material/Close';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TuneIcon from '@mui/icons-material/Tune';

import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setFocus } from '../store/slices/inputsFocusSlice';
import { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime, getTrips, initialCoords, setSelectedTrip } from '../store/slices/tripSlice';
import { clearStartAddress, clearEndAddress, setStartAddress, setEndAddress } from '../store/slices/addressSlice';
import { getTransferStops } from '../store/slices/transferStopSlice';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import AdditionalPreferences from './AdditionalPreferences';

import { useTranslation } from 'react-i18next';

export function TripRequestForm() {
    const startInputFocused = useAppSelector((state) => state.focus.startInputFocused)
    const endInputFocused = useAppSelector((state) => state.focus.endInputFocused)

    const startAddress = useAppSelector((state) => state.address.startAddress)
    const endAddress = useAppSelector((state) => state.address.endAddress)

    const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
    const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)
    const isLoading = useAppSelector((state) => state.trip.isLoading)

    const [dialogOpen, setDialogOpen] = useState(false)
    const { t } = useTranslation()

    const startInputValue = startAddress === null ? '' : (startAddress === '' ? `${startCoords[0].toFixed(3)} ${startCoords[1].toFixed(3)}` : startAddress)
    const endInputValue = endAddress === null ? '' : (endAddress === '' ? `${endCoords[0].toFixed(3)} ${endCoords[1].toFixed(3)}` : endAddress)

    const inputValid = startAddress !== null && endAddress !== null
    const dispatch = useAppDispatch()


    useEffect(() => {
      changeCursor()
    }, [startInputFocused, endInputFocused])

    useEffect(() => {
      dispatch(getTransferStops())
    }, [])


    /**
    * Changes the cursor style based on the input focus
    */
    const changeCursor = () => {
      const elements = document.getElementsByClassName("leaflet-grab")
      let cursorStyle = "grab"

      if (startInputFocused || endInputFocused) {
      cursorStyle = "crosshair"
      }

      for (let element of elements) {
      element.style.cursor = cursorStyle
      cursorStyle = "crosshair"
      }
    }

    /**
    * Clears the input field and the address
    * @param origin - The origin of the input field
    */
    const clearInput = (origin: string) => {
      if (origin === 'start') {
          dispatch(setStartCoords(initialCoords))
          dispatch(clearStartAddress())
      }
      else {
          dispatch(setEndCoords(initialCoords))
          dispatch(clearEndAddress())
      }

      // Remove the route if present
      dispatch(setSelectedTrip(-1))
    }

    /**
    * Swaps the origin address and coordinates with the destination ones
    */
    const swapOriginAndDestination = () => {
        if (startAddress === null && endAddress !== null) {
            dispatch(setStartAddress(endAddress))
            dispatch(clearEndAddress())

            dispatch(setStartCoords(endCoords))
            dispatch(setEndCoords(initialCoords))
        }
        else if (startAddress !== null && endAddress === null) {
            dispatch(clearStartAddress())
            dispatch(setEndAddress(startAddress))

            dispatch(setEndCoords(startCoords))
            dispatch(setStartCoords(initialCoords))
        }
        else if (startAddress !== null && endAddress !== null) {
            dispatch(setStartAddress(endAddress))
            dispatch(setEndAddress(startAddress))

            dispatch(setStartCoords(endCoords))
            dispatch(setEndCoords(startCoords))
        }
    }

    return (
        <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton size='large' edge='start' sx={{ color: 'black' }} onClick={() => setDialogOpen(true)}>
                <TuneIcon />
            </IconButton>
            <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, transform: 'translateX(-5%)' }}>
                {t('form.plan')}
            </h2>
        </div>


        {/* Start point text field */}
        <TextField style={{ backgroundColor: "white" }} slotProps={
        {
            input: {
            endAdornment:
            <InputAdornment position='end'>
                <IconButton edge='end' onClick={() => clearInput('start')}>
                <CloseIcon/>
                </IconButton>
            </InputAdornment>}}}
        size="small" value={startInputValue} placeholder='Start' type='text'
        onFocus={() => dispatch(setFocus({origin: "start", focused: true}))}
        />
        <Tooltip title={t('form.switch')}>
        <IconButton size="medium" sx={{ color: 'black', alignSelf: 'center' }} onClick={swapOriginAndDestination}>
            <SwapVertIcon fontSize='inherit'/>
        </IconButton>
        </Tooltip>
        

        {/* End point text field */}
        <TextField sx={{ backgroundColor: "white", mb: 2 }} slotProps={
        {
            input: {
            endAdornment:
            <InputAdornment position='end'>
                <IconButton edge='end' onClick={() => clearInput('end')}>
                    <CloseIcon/>
                </IconButton>
            </InputAdornment>}}}
        size="small" value={endInputValue} placeholder={t('form.end')} type='text'
        onFocus={() => dispatch(setFocus({origin: "end", focused: true}))}
        />


        <div style={{ display: 'flex', gap: '10px'}}>
            {/* Select date */}
            <DatePicker label={t('form.departureDate')} sx={{ backgroundColor: 'white', flex: "1" }} defaultValue={dayjs(Date.now())} onChange={(date) => dispatch(setDepartureDate({year: date.$y, month: date.$M, day: date.$D}))}/>

            {/* Select time */}
            <TimePicker label={t('form.departureTime')} sx={{ backgroundColor: 'white', flex: "0 0 40%" }} defaultValue={dayjs(Date.now())} onChange={(time) => dispatch(setDepartureTime(time.$d.toLocaleTimeString()))}/>
        </div>
        <AdditionalPreferences dialogOpen={dialogOpen} closeDialog={() => setDialogOpen(false)}/>

        <Button disabled={!inputValid || isLoading} sx={{width: '60%', alignSelf: 'center', textTransform: 'none', fontSize: '1rem'}} variant='contained' size='large' loading={isLoading} loadingPosition='end'
                onClick={() => dispatch(getTrips())}>
            {t('form.show')}
        </Button>
    </>
    )
}

export default TripRequestForm
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

import {Close, Minimize, SwapVert, Tune, ZoomOutMap} from '@mui/icons-material'

import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setFocus } from '../store/slices/inputsFocusSlice';
import { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime, getTrips, initialCoords, setSelectedTrip, clearTripsAndRoutes } from '../store/slices/tripSlice';
import { clearStartAddress, clearEndAddress, setStartAddress, setEndAddress } from '../store/slices/addressSlice';
import { getTransferStops } from '../store/slices/transferStopSlice';
import { useEffect, useState } from 'react';
import dayjs, {Dayjs} from 'dayjs';
import AdditionalPreferences from './AdditionalPreferences';
import type { ResultStatus } from "../../../types/ResultStatus.ts";

import { useTranslation } from 'react-i18next';
import {DateValidationError, TimeValidationError} from "@mui/x-date-pickers";
import useIsMobile from "../hooks/useIsMobile.ts";

interface TripRequestFormProps {
    changeHeight?: (minimize: boolean, origin: string) => void;
}

export function TripRequestForm({ changeHeight }: TripRequestFormProps) {
    const { startInputFocused, endInputFocused, pickupInputFocused } = useAppSelector((state) => state.focus)

    const startAddress = useAppSelector((state) => state.address.startAddress)
    const endAddress = useAppSelector((state) => state.address.endAddress)

    const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
    const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)
    const isLoading = useAppSelector((state) => state.trip.isLoading)

    const isMobile = useIsMobile()
    const [minimized, setMinimized] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false)
    const { t } = useTranslation()

    const startInputValue = startAddress === null ? '' : (startAddress === '' ? `${startCoords[0].toFixed(3)} ${startCoords[1].toFixed(3)}` : startAddress)
    const endInputValue = endAddress === null ? '' : (endAddress === '' ? `${endCoords[0].toFixed(3)} ${endCoords[1].toFixed(3)}` : endAddress)

    const [dateError, setDateError] = useState<ResultStatus>({error: false, message: ''})
    const [timeError, setTimeError] = useState<ResultStatus>({error: false, message: ''})
    const [comingBackDateValid, setComingBackDateValid] = useState(true)
    const [comingBackTimeValid, setComingBackTimeValid] = useState(true)

    const inputValid = startAddress !== null && endAddress !== null && !dateError.error && !timeError.error && comingBackDateValid && comingBackTimeValid

    const dispatch = useAppDispatch()


    useEffect(() => {
      changeCursor()
    }, [startInputFocused, endInputFocused, pickupInputFocused])

    useEffect(() => {
      dispatch(getTransferStops())
    }, [])

    const handleDateError = (error: DateValidationError, date: Dayjs | null) => {
        if (error === null && date !== null) {
            setDateError({error: false, message: ''})
        }
        else {
            setDateError({error: true, message: t('form.validation.invalidDate')})
        }
    }
    const handleTimeError = (error: TimeValidationError, time: Dayjs | null) => {
        if (error === null && time !== null) {
            setTimeError({error: false, message: ''})
        }
        else {
            setTimeError({error: true, message: t('form.validation.invalidTime')})
        }
    }

    const handleDateChange = (date: Dayjs | null) => {
        if (date !== null ) {
            setDateError({error: false, message: ''})
            dispatch(setDepartureDate({year: date.year(), month: date.month(), day: date.date()}))
        }
    }

    const handleTimeChange = (time: Dayjs | null) => {
        if (time !== null ) {
            setTimeError({error: false, message: ''})
            dispatch(setDepartureTime(time.toDate().toLocaleTimeString()))
        }
    }

    /**
    * Changes the cursor style based on the input focus
    */
    const changeCursor = () => {
      const elements = document.getElementsByClassName("leaflet-grab")
      let cursorStyle = "grab"

      if (startInputFocused || endInputFocused || pickupInputFocused) {
        cursorStyle = "crosshair"
      }

      for (let element of elements) {
        (element as HTMLElement).style.cursor = cursorStyle
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

    /**
     * Changes the height of summary component when in mobile mode
     * @param minimize Whether to minimize the component or not
     */
    const changeRequestFormHeight = (minimize: boolean) => {
        setMinimized(minimize)
        if (changeHeight) {
            changeHeight(minimize, "form")
        }
    }

    const handleDialogClosed = (comingBackDateValid: boolean, comingBackTimeValid: boolean) => {
        setDialogOpen(false)
        if (!comingBackDateValid) {
            setComingBackDateValid(false)
        }
        else {
            setComingBackDateValid(true)
        }

        if (!comingBackTimeValid) {
            setComingBackTimeValid(false)
        }
        else {
            setComingBackTimeValid(true)
        }
    }

    return (
        <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tooltip arrow placement='right' title={t('form.showPreferences')}>
                <IconButton size='large' edge='start' sx={{ color: 'black' }} onClick={() => setDialogOpen(true)}>
                    <Tune/>
                </IconButton>
            </Tooltip>
            <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, transform: `translateX(${isMobile ? '0' : '-5%'})` }}>
                {t('form.plan')}
            </h2>
            {
                isMobile && (minimized ?
                    <IconButton onClick={() => changeRequestFormHeight(false)} color='primary' edge='start'>
                        <ZoomOutMap/>
                    </IconButton>
                    :
                    <IconButton onClick={() => changeRequestFormHeight(true)} color='primary' edge='start'>
                        <Minimize/>
                    </IconButton>
                )
            }
        </div>


        {/* Start point text field */}
        <TextField style={{ backgroundColor: "white" }} slotProps={
        {
            input: {
            endAdornment:
            <InputAdornment position='end'>
                <IconButton edge='end' onClick={() => clearInput('start')}>
                    <Close/>
                </IconButton>
            </InputAdornment>}}}
            size="small" value={startInputValue} placeholder='Start' type='text'
            onFocus={() => dispatch(setFocus({origin: "start", focused: true}))}
        />
        <Tooltip placement='right' title={t('form.switch')}>
            <IconButton size="medium" sx={{ color: 'black', alignSelf: 'center' }} onClick={swapOriginAndDestination}>
                <SwapVert fontSize='inherit'/>
            </IconButton>
        </Tooltip>
        

        {/* End point text field */}
        <TextField sx={{ backgroundColor: "white", mb: 2 }} slotProps={
        {
            input: {
            endAdornment:
            <InputAdornment position='end'>
                <IconButton edge='end' onClick={() => clearInput('end')}>
                    <Close/>
                </IconButton>
            </InputAdornment>}}}
        size="small" value={endInputValue} placeholder={t('form.end')} type='text'
        onFocus={() => dispatch(setFocus({origin: "end", focused: true}))}
        />


        <div style={{ display: 'flex', gap: '10px'}}>
            {/* Select date */}
            <DatePicker label={t('form.departureDate')} sx={{ backgroundColor: 'white', flex: "1" }} defaultValue={dayjs(Date.now())}
                        onError={(err, val) => handleDateError(err, val)}
                        slotProps={{
                            textField: {
                                helperText: dateError.message
                            }
                        }}
                        onChange={(date) => handleDateChange(date)}/>

            {/* Select time */}
            <TimePicker label={t('form.departureTime')} sx={{ backgroundColor: 'white', flex: "0 0 40%" }} defaultValue={dayjs(Date.now())}
                        onError={(err, val) => handleTimeError(err, val)}
                        slotProps={{
                            textField: {
                                helperText: timeError.message
                            }
                        }}
                        onChange={(time) => handleTimeChange(time)}/>
        </div>
        <AdditionalPreferences dialogOpen={dialogOpen} closeDialog={(dateValid, timeValid) => handleDialogClosed(dateValid, timeValid)}/>

        {/* Get routes button */}
        <Button disabled={!inputValid || isLoading} sx={{width: '60%', alignSelf: 'center', textTransform: 'none', fontSize: '1rem'}} variant='contained' size='large' loading={isLoading} loadingPosition='end'
                onClick={() => {dispatch(clearTripsAndRoutes());dispatch(getTrips())}}>
            {t('form.show')}
        </Button>
    </>
    )
}

export default TripRequestForm
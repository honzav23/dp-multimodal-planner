/**
 * @file TripRequestForm.tsx
 * @brief Component for planning a trip, including input fields for start and end points, date and time pickers.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { TextField, InputAdornment, IconButton, Button, Tooltip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import {Close, Minimize, SwapVert, Tune, ZoomOutMap} from '@mui/icons-material'

import { useAppSelector, useAppDispatch } from '../../store/hooks.ts';
import { setFocus } from '../../store/slices/inputsFocusSlice.ts';
import { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime, getTrips, initialCoords, setSelectedTrip, clearTripsAndRoutes } from '../../store/slices/tripSlice.ts';
import { clearStartAddress, clearEndAddress } from '../../store/slices/addressSlice.ts';
import { getTransferStops } from '../../store/slices/transferStopSlice.ts';
import { useEffect, useState, type KeyboardEvent } from 'react';
import dayjs, {Dayjs} from 'dayjs';
import AdditionalPreferences from './AdditionalPreferences.tsx';

import { useTranslation } from 'react-i18next';
import useIsMobile from "../../hooks/useIsMobile.ts";
import { useSwapAddresses } from "../../hooks/useSwapAddress.ts";
import useDateError from "../../hooks/useDateError.ts";
import useTimeError from "../../hooks/useTimeError.ts";

interface TripRequestFormProps {
    minimize?: (origin: string) => void;
    maximize?: (origin: string) => void;
}

export function TripRequestForm({ minimize, maximize }: TripRequestFormProps) {
    const { startInputFocused, endInputFocused, pickupInputFocused } = useAppSelector((state) => state.focus)

    const { startAddress, endAddress } = useAppSelector((state) => state.address)

    const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
    const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)
    const isLoading = useAppSelector((state) => state.trip.isLoading)

    const isMobile = useIsMobile()
    const swapOriginAndDestination = useSwapAddresses()
    const [minimized, setMinimized] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false)
    const { t } = useTranslation()

    const startInputValue = startAddress === null ? '' : (startAddress === '' ? `${startCoords[0].toFixed(5)} ${startCoords[1].toFixed(5)}` : startAddress)
    const endInputValue = endAddress === null ? '' : (endAddress === '' ? `${endCoords[0].toFixed(5)} ${endCoords[1].toFixed(5)}` : endAddress)

    const [dateError, setDateError, handleDateError] = useDateError()
    const [timeError, setTimeError, handleTimeError] = useTimeError()
    const [comingBackDateValid, setComingBackDateValid] = useState(true)
    const [comingBackTimeValid, setComingBackTimeValid] = useState(true)

    const formValid = startAddress !== null && endAddress !== null && !dateError.error && !timeError.error && comingBackDateValid && comingBackTimeValid

    const dispatch = useAppDispatch()


    useEffect(() => {
        changeCursorStyle()
    }, [startInputFocused, endInputFocused, pickupInputFocused])

    useEffect(() => {
        dispatch(getTransferStops())
    }, [])

    // Used to be able to submit the form by Enter key
    useEffect(() => {
        window.addEventListener('keyup', (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
            }
        })

        return () => {
            window.removeEventListener('keyup', handleSubmit)
        }
    }, [formValid, isLoading]);


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
    const changeCursorStyle = () => {
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

    const handleDialogClosed = (comingBackDateValid: boolean, comingBackTimeValid: boolean) => {
        setDialogOpen(false)
        setComingBackDateValid(comingBackDateValid)
        setComingBackTimeValid(comingBackTimeValid)
    }

    /**
     * Minimize only if the function is defined
     */
    const conditionalMinimize = () => {
        if (minimize) {
            setMinimized(true)
            minimize("form")
        }
    }

    /**
     * Maximize only if the function is defined
     */
    const conditionalMaximize = () => {
        if (maximize) {
            setMinimized(false)
            maximize("form")
        }
    }

    const handleSubmit = () => {
        if (formValid && !isLoading) {
            dispatch(getTrips())
            dispatch(clearTripsAndRoutes());
        }
    }

    // Disable opening the settings when submitting the form by Enter key
    const disableOpeningSettingsWhenSubmittingForm = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
        }
    }

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Tooltip arrow placement='right' title={t('form.showPreferences')}>
                    <IconButton size='large' edge='start' sx={{ color: 'black' }} onClick={() => setDialogOpen(true)} onKeyDown={disableOpeningSettingsWhenSubmittingForm}>
                        <Tune/>
                    </IconButton>
                </Tooltip>
                <h2 style={{ flexGrow: 1, textAlign: 'center', margin: 0, transform: `translateX(${isMobile ? '0' : '-5%'})` }}>
                    {t('form.plan')}
                </h2>
                {
                    isMobile && (minimized ?
                        <IconButton onClick={conditionalMaximize} color='primary' edge='start'>
                            <ZoomOutMap/>
                        </IconButton>
                        :
                        <IconButton onClick={conditionalMinimize} color='primary' edge='start'>
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
                    </InputAdornment>
                },
                htmlInput: {
                    readOnly: true
                }
            }}
                size="small" value={startInputValue} placeholder={t('form.start')} type='text'
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
                        </InputAdornment>
                },
                htmlInput: {
                    readOnly: true
                }
            }}
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
            <Button disabled={!formValid || isLoading} sx={{width: '60%', alignSelf: 'center', textTransform: 'none', fontSize: '1rem'}} variant='contained' size='large' loading={isLoading} loadingPosition='end'
                    onClick={handleSubmit}>
                {t('form.show')}
            </Button>
        </>
    )
}

export default TripRequestForm
/**
 * @file AdditionalPreferences.tsx
 * @brief Component for handling additional preferences, including selecting transfer stops or minimizing transfers.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { Autocomplete, TextField, Tooltip, ListItem, ListItemText, Divider, Dialog, DialogTitle, 
    DialogContent, IconButton, Checkbox, FormControlLabel, Box, InputAdornment } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { WarningAmber, CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { TransferStop } from "../../../../types/TransferStop.ts";
import {
    setTransferStop,
    setSelectedModeOfTransport,
    setFindBestTrip,
    initialCoords,
    setPickupCoords,
    clearComingBackDateTime,
    setComingBackDate,
    setComingBackTime,
    setUseOnlyPublicTransport
} from "../../store/slices/tripSlice.ts";
import { useAppSelector, useAppDispatch } from "../../store/hooks.ts";
import type { TransportMode } from "../../../../types/TransportMode.ts";
import { clearPickupAddress } from "../../store/slices/addressSlice.ts";
import { setFocus } from "../../store/slices/inputsFocusSlice.ts";
import { useTranslation } from "react-i18next";
import {useState} from "react";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs, {Dayjs} from "dayjs";
import {TimePicker} from "@mui/x-date-pickers/TimePicker";
import useDateError from "../../hooks/useDateError.ts";
import useTimeError from "../../hooks/useTimeError.ts";

interface AdditionalPreferencesProps {
    dialogOpen: boolean
    closeDialog: (dateValid: boolean, timeValid: boolean) => void
}

function AdditionalPreferences({ dialogOpen, closeDialog }: AdditionalPreferencesProps) {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops)

    const selectedTransferStop = useAppSelector((state) => state.trip.tripRequest.preferences.transferStop)
    const selectedMeansOfTransport = useAppSelector((state) => state.trip.tripRequest.preferences.modeOfTransport)
    const findBestTripSelected = useAppSelector((state) => state.trip.tripRequest.preferences.findBestTrip)
    const useOnlyPublicTransport = useAppSelector((state) => state.trip.tripRequest.preferences.useOnlyPublicTransport)
    const pickupAddress = useAppSelector((state) => state.address.pickupAddress)
    const pickupCoords = useAppSelector((state) => state.trip.tripRequest.preferences.pickupCoords)
    const preferences = useAppSelector((state) => state.trip.tripRequest.preferences)

    const [returnDateTimeShown, setReturnDateTimeShown] = useState(false)
    const [dateError, setDateError, handleDateError] = useDateError()
    const [timeError, setTimeError, handleTimeError] = useTimeError()
    const defaultDate = dayjs(Date.now())
    
    const pickupInputValue = pickupAddress === null ? '' : (pickupAddress === '' ? `${pickupCoords[0].toFixed(5)} ${pickupCoords[1].toFixed(5)}` : pickupAddress)

    const { t } = useTranslation()

    const icon = <CheckBoxOutlineBlank fontSize="small" />;
    const checkedIcon = <CheckBox fontSize="small" />;

    const options: TransportMode[] = ["bus", "rail", "tram", "trolleybus", "metro"]

    const dispatch = useAppDispatch()

    const clearPickupInput = () => {
        dispatch(setPickupCoords(initialCoords))
        dispatch(clearPickupAddress())     
    }

    /**
     * Shows the date and time inputs when the input is checked and sets the
     * return date and time to current ones
     * @param checked Checkbox checked
     */
    const handleComingBackCheckboxChange = (checked: boolean) => {
        if (checked) {
            // Time is set as well
            dispatch(setComingBackDate({year: defaultDate.year(), month: defaultDate.month(), day: defaultDate.date()}))
            setReturnDateTimeShown(true)
        }
        else {
            dispatch(clearComingBackDateTime())
            setReturnDateTimeShown(false)
        }
        setDateError({error: false, message: ''})
        setTimeError({error: false, message: ''})
    }

    const handleDateChange = (date: Dayjs | null) => {
        if (date !== null ) {
            setDateError({error: false, message: ''})
            dispatch(setComingBackDate({year: date.year(), month: date.month(), day: date.date()}))
        }
    }

    const handleTimeChange = (time: Dayjs | null) => {
        if (time !== null ) {
            setTimeError({error: false, message: ''})
            dispatch(setComingBackTime(time.toDate().toLocaleTimeString()))
        }
    }

    return (
        <Dialog open={dialogOpen} fullWidth maxWidth='md'>
            <DialogTitle textAlign='center' variant="h4" sx={{ backgroundColor: '#f3f3f3' }}>
                {t('preferences.headline')}
            </DialogTitle>
            {/* https://mui.com/material-ui/react-dialog/#customization */}

             {/* Close dialog button */}
            <IconButton
                aria-label="close"
                onClick={() => closeDialog(!dateError.error, !timeError.error)}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
                >
                <CloseIcon />
            </IconButton>
            <Divider></Divider>
            <DialogContent sx={{ backgroundColor: '#f3f3f3' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px'}}>
                    <Box sx={{ marginLeft: { md: '5%', sm: 0 }, display: 'flex', gap: '15px', flexDirection: 'column', width: { md: '30%', sm: '100%' } }}>
                        {/* Select transfer stop */}
                        <Autocomplete size='small' sx={{ backgroundColor: 'white' }} value={selectedTransferStop}
                                      getOptionLabel={(op) => op.stopName} options={transferStops}
                                      onChange={(_, value: TransferStop | null) => (dispatch(setTransferStop(value)))} renderInput={(params) =>
                            <TextField label={t('preferences.transferPoints')} {...params}/>
                        }
                                      renderOption={(props, option) => {
                                          return (
                                              <div key={option.stopId}>
                                                  <ListItem {...props} key={option.stopId} secondaryAction={ (!option.hasParking) &&
                                                      <Tooltip title={t('preferences.noParkingLots')} placement='right'>
                                                          <WarningAmber color='warning'/>
                                                      </Tooltip>
                                                  }>
                                                      <ListItemText primary={option.stopName}/>
                                                  </ListItem>
                                                  <Divider/>
                                              </div>
                                          )
                                      }}
                        />

                        {/* Select pick up point */}
                        <TextField style={{ backgroundColor: "white" }} slotProps={
                            {
                                input: {
                                    endAdornment:
                                        <InputAdornment position='end'>
                                            <IconButton edge='end' onClick={() => clearPickupInput()}>
                                                <CloseIcon/>
                                            </IconButton>
                                        </InputAdornment>
                                },
                                htmlInput: {
                                    readOnly: true
                                }
                            }}
                                   size="small" value={pickupInputValue} label={t('preferences.pickup')} type='text'
                                   onFocus={() => {dispatch(setFocus({origin: "pickup", focused: true}));closeDialog(!dateError.error, !timeError.error)}}
                        />


                        {/* Select means of public transport */}
                        {/*https://mui.com/material-ui/react-autocomplete/#checkboxes  20. 2. 2025*/}
                        <Autocomplete
                            multiple
                            sx={{ backgroundColor: 'white' }}
                            options={options}
                            size='small'
                            value={selectedMeansOfTransport}
                            onChange={(_, value: TransportMode[] | null) => (dispatch(setSelectedModeOfTransport(value)))}
                            disableCloseOnSelect
                            renderOption={(props, option, { selected }) => {
                                const { key, ...optionProps } = props;
                                return (
                                    <li key={key} {...optionProps}>
                                        <Checkbox
                                            icon={icon}
                                            checkedIcon={checkedIcon}
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                        {t(`transport.${option}`)}
                                    </li>
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label={t('preferences.transport')} />
                            )}
                        />
                    </Box>
                    <Box sx={{ marginLeft: { md: '5%', sm: 0 }, display: 'flex', gap: '15px', flexDirection: 'column', width: { md: '30%', sm: '100%' }}}>
                        {/* Use only public transport */}
                        <FormControlLabel control={<Checkbox onChange={(_, val) => dispatch(setUseOnlyPublicTransport(val))}
                                                             checked={useOnlyPublicTransport}/>} label={t('preferences.onlyPublicTransport')}/>

                         {/* Find the best solution checkbox */}
                        <FormControlLabel control={<Checkbox onChange={(_, val) => dispatch(setFindBestTrip(val))}
                            checked={findBestTripSelected}/>} label={`${t('preferences.findBestTrip')} (${t('preferences.findBestTripText')})`}/>

                        {/* I will be coming back checkbox */}
                        <FormControlLabel control={<Checkbox onChange={(_, val) => handleComingBackCheckboxChange(val)}
                           checked={returnDateTimeShown}/>} label={t('preferences.comingBack')}/>

                        {returnDateTimeShown && (
                            <>
                                {/* Select date */}
                                <DatePicker sx={{ backgroundColor: 'white' }} label={t('preferences.comingBackDate')} defaultValue={defaultDate}
                                            onError={(err, val) => handleDateError(err, val)}
                                            slotProps={{
                                                textField: {
                                                    helperText: dateError.message
                                                }
                                            }}
                                            value={preferences.comingBack ? dayjs(preferences.comingBack.returnDate) : null}
                                            onChange={(date) => handleDateChange(date)}/>

                                {/* Select time */}
                                <TimePicker sx={{ backgroundColor: 'white' }} label={t('preferences.comingBackTime')} defaultValue={defaultDate}
                                            onError={(err, val) => handleTimeError(err, val)}
                                            slotProps={{
                                                textField: {
                                                    helperText: timeError.message
                                                }
                                            }}
                                            value={preferences.comingBack ? dayjs(`${preferences.comingBack.returnDate}T${preferences.comingBack.returnTime}`) : null}
                                            onChange={(time) => handleTimeChange(time)}/>
                            </>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default AdditionalPreferences;
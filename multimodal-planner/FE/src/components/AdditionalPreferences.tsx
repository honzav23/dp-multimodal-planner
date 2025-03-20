/**
 * @file AdditionalPreferences.tsx
 * @brief Component for handling additional preferences, including selecting transfer stops or minimizing transfers.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import { Autocomplete, TextField, Tooltip, ListItem, ListItemText, Divider, Dialog, DialogTitle, 
    DialogContent, IconButton, Checkbox, FormControlLabel, Box, InputAdornment } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { WarningAmber, CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";

import { TransferStop } from "../../../types/TransferStop";
import {
    setTransferStop,
    setSelectedModeOfTransport,
    setFindBestTrip,
    initialCoords,
    setPickupCoords,
    setDepartureDate, setDepartureTime,
    clearComingBackDateTime,
    setComingBackDate,
    setComingBackTime
} from "../store/slices/tripSlice";
import { availableLanguages } from "../../i18n";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import type { TransportMode } from "../../../types/TransportMode";
import { clearPickupAddress } from "../store/slices/addressSlice";
import { setFocus } from "../store/slices/inputsFocusSlice";

import { useTranslation } from "react-i18next";
import {useState} from "react";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {TimePicker} from "@mui/x-date-pickers/TimePicker";

interface AdditionalPreferencesProps {
    dialogOpen: boolean
    closeDialog: () => void
}

function AdditionalPreferences({ dialogOpen, closeDialog }: AdditionalPreferencesProps) {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops)

    const selectedTransferStop = useAppSelector((state) => state.trip.tripRequest.preferences.transferStop)
    const selectedMeansOfTransport = useAppSelector((state) => state.trip.tripRequest.preferences.modeOfTransport)
    const findBestTripSelected = useAppSelector((state) => state.trip.tripRequest.preferences.findBestTrip)
    const pickupAddress = useAppSelector((state) => state.address.pickupAddress)
    const pickupCoords = useAppSelector((state) => state.trip.tripRequest.preferences.pickupCoords)

    const [returnDateTimeShown, setReturnDateTimeShown] = useState(false)
    const defaultDate = dayjs(Date.now())
    
    const pickupInputValue = pickupAddress === null ? '' : (pickupAddress === '' ? `${pickupCoords[0].toFixed(3)} ${pickupCoords[1].toFixed(3)}` : pickupAddress)

    const { t, i18n } = useTranslation()

    const icon = <CheckBoxOutlineBlank fontSize="small" />;
    const checkedIcon = <CheckBox fontSize="small" />;

    const options: TransportMode[] = ["bus", "rail", "tram", "trolleybus"]

    const dispatch = useAppDispatch()

    /**
     * Change the language of the application based on lang parameter
     * @param lang Selected language
     */
    const changeLanguage = async (lang: string | null) => {
        if (lang === null) {
            await i18n.changeLanguage('en')
        }
        else {
            await i18n.changeLanguage(lang)
        }
    }

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
                onClick={closeDialog}
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

                        {/* Select language */}
                        <Autocomplete size='small' sx={{ backgroundColor: 'white' }}
                                      options={availableLanguages}
                                      getOptionLabel={(option) => t(`language.${option}`)}
                                      value={i18n.language}
                                      onChange={(_, value: string | null) => changeLanguage(value)}
                                      renderInput={(params) =>
                                          <TextField label={t('language.select')} {...params}/>
                                      }
                                      renderOption={(props, option) => {
                                          return (
                                              <ListItem {...props} key={option} divider={option !== 'en'}>
                                                  <ListItemText primary={t(`language.${option}`)}/>
                                              </ListItem>
                                          )
                                      }}
                        />
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
                                        </InputAdornment>}}}
                                   size="small" value={pickupInputValue} label={t('preferences.pickup')} type='text'
                                   onFocus={() => {dispatch(setFocus({origin: "pickup", focused: true}));closeDialog()}}
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
                         {/* Find the best solution checkbox */}
                        <FormControlLabel control={<Checkbox onChange={(_, val) => dispatch(setFindBestTrip(val))}
                            checked={findBestTripSelected}/>} label={t('preferences.bestTrip')}/>

                        {/* I will be coming back checkbox */}
                        <FormControlLabel control={<Checkbox onChange={(_, val) => handleComingBackCheckboxChange(val)}
                           checked={returnDateTimeShown}/>} label={t('preferences.return')}/>

                        {returnDateTimeShown && (
                            <>
                                {/* Select date */}
                                <DatePicker sx={{ backgroundColor: 'white' }} label={t('preferences.returnDate')} defaultValue={defaultDate}
                                            onChange={(date) => dispatch(setComingBackDate({year: date.year(), month: date.month(), day: date.date()}))}/>

                                {/* Select time */}
                                <TimePicker sx={{ backgroundColor: 'white' }} label={t('preferences.returnTime')} defaultValue={defaultDate}
                                            onChange={(time) => dispatch(setComingBackTime(time.$d.toLocaleTimeString()))}/>
                            </>
                        )}
                    </Box>
                </Box>

            </DialogContent>
        </Dialog>
    );
};

export default AdditionalPreferences;
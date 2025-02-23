/**
 * @file AdditionalPreferences.tsx
 * @brief Component for handling additional preferences, including selecting transfer stops or minimizing transfers.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import { Autocomplete, TextField, Tooltip, ListItem, ListItemText, Divider, Dialog, DialogTitle, DialogContent, IconButton, Checkbox } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { WarningAmber, CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";

import { TransferStop } from "../../../types/TransferStop";
import { setTransferStop, setSelectedModeOfTransport } from "../store/slices/tripSlice";

import { useAppSelector, useAppDispatch } from "../store/hooks";
import type { TransportMode } from "../../../types/TransportMode";

interface AdditionalPreferencesProps {
    dialogOpen: boolean
    closeDialog: () => void
}

function AdditionalPreferences({ dialogOpen, closeDialog }: AdditionalPreferencesProps) {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops)
    const selectedTransferStop = useAppSelector((state) => state.trip.tripRequest.preferences.transferStop)
    const selectedMeansOfTransport = useAppSelector((state) => state.trip.tripRequest.preferences.modeOfTransport)

    const icon = <CheckBoxOutlineBlank fontSize="small" />;
    const checkedIcon = <CheckBox fontSize="small" />;

    const options: TransportMode[] = ["bus", "rail", "tram", "trolleybus"]

    const dispatch = useAppDispatch()
    return (
        <Dialog open={dialogOpen} fullWidth maxWidth='md'>
            <DialogTitle textAlign='center' variant="h4" sx={{ backgroundColor: '#f3f3f3' }}>
                Additional preferences
            </DialogTitle>
            {/* https://mui.com/material-ui/react-dialog/#customization */}
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
                <div style={{ marginLeft: '5%', display: 'flex', gap: '15px', flexDirection: 'column', width: '30%' }}>
                    
                    {/* Select transfer stop */}
                    <Autocomplete size='small' sx={{ backgroundColor: 'white' }} value={selectedTransferStop}
                                  onChange={(_, value: TransferStop | null) => (dispatch(setTransferStop(value)))} renderInput={(params) =>
                        <TextField label="Transfer points" {...params}/>
                    }
                    renderOption={(props, option) => {
                        return (
                        <div key={option.stopId}>
                            <ListItem {...props} key={option.stopId} secondaryAction={ (!option.hasParking) &&
                            <Tooltip title="No parking lots nearby" placement='right'>
                                <WarningAmber color='warning'/>
                            </Tooltip>
                            }>
                            <ListItemText primary={option.stopName}/>
                            </ListItem>
                            <Divider/>
                        </div>
                        )
                    }}
                    getOptionLabel={(op) => op.stopName} options={transferStops}/>

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
                                    {option}
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Preferred means of transport" />
                        )}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AdditionalPreferences;
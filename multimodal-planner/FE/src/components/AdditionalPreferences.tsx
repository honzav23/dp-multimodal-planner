/**
 * @file AdditionalPreferences.tsx
 * @brief Component for handling additional preferences, including selecting transfer stops or minimizing transfers.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import { Autocomplete, TextField, Tooltip, ListItem, ListItemText, Divider, Dialog, DialogTitle, DialogContent, IconButton, Checkbox } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { TransferStop } from "../../../types/TransferStop";
import { setTransferStop } from "../store/slices/tripSlice";

import { useAppSelector, useAppDispatch } from "../store/hooks";

interface AdditionalPreferencesProps {
    dialogOpen: boolean
    closeDialog: () => void
}

function AdditionalPreferences({ dialogOpen, closeDialog }: AdditionalPreferencesProps) {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops)
    const selectedTransferStop = useAppSelector((state) => state.trip.tripRequest.preferences.transferStop)

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
                <div style={{ marginLeft: '5%', display: 'flex', flexDirection: 'column', width: '30%' }}>
                    
                    {/* Select transfer stop */}
                    <Autocomplete size='small' sx={{ backgroundColor: 'white' }} value={selectedTransferStop} onChange={(_, value: TransferStop | null) => (dispatch(setTransferStop(value)))} renderInput={(params) =>
                        <TextField label="Transfer points" {...params}/>
                    }
                    renderOption={(props, option) => {
                        return (
                        <div key={option.stopId}>
                            <ListItem {...props} key={option.stopId} secondaryAction={ (!option.hasParking) &&
                            <Tooltip title="No parking lots nearby" placement='right'>
                                <WarningAmberIcon color='warning'/>
                            </Tooltip>
                            }>
                            <ListItemText primary={option.stopName}/>
                            </ListItem>
                            <Divider/>
                        </div>
                        )
                    }}
                    getOptionLabel={(op) => op.stopName} options={transferStops}/>
                    {/* TODO add autocomplete with multiple choices and checkboxes */}
                    {/* <Autocomplete
                        multiple
                        options={["bus", "train", "tram", "trolleybus"]}
                        disableCloseOnSelect
                        // getOptionLabel={(option) => option.title}
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
                                {option.title}
                            </li>
                            );
                        }}
                        style={{ width: 500 }}
                        renderInput={(params) => (
                            <TextField {...params} label="Checkboxes" placeholder="Favorites" />
                        )}
    /> */}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AdditionalPreferences;
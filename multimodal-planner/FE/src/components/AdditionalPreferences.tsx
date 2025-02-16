/**
 * @file AdditionalPreferences.tsx
 * @brief Component for handling additional preferences, including selecting transfer stops or minimizing transfers.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import { Autocomplete, TextField, Tooltip, ListItem, ListItemText, Divider } from "@mui/material";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { TransferStop } from "../../../types/TransferStop";
import { setTransferStop } from "../store/slices/tripSlice";

import { useAppSelector, useAppDispatch } from "../store/hooks";

function AdditionalPreferences() {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops)
    const selectedTransferStop = useAppSelector((state) => state.trip.tripRequest.preferences.transferStop)

    const dispatch = useAppDispatch()
    return (
        <Autocomplete value={selectedTransferStop} onChange={(_, value: TransferStop | null) => (dispatch(setTransferStop(value)))} renderInput={(params) =>
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
    );
};

export default AdditionalPreferences;
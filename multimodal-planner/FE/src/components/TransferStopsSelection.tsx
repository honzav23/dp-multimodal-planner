import {CircleMarker, Marker, Popup} from "react-leaflet";
import { Divider, Button, Stack } from "@mui/material";
import type { TransferStop } from "../../../types/TransferStop";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { setTransferStop, initialCoords } from "../store/slices/tripSlice";

import markerIconTransfer from '../img/marker-icon-orange.png'
import {Icon} from "leaflet";

function TransferStopsSelection() {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops);
    const selectedTransferStop = useAppSelector((state) => state.trip.tripRequest.preferences.transferStop);

    const selectTransferStop = (stopSelected: boolean, stop: TransferStop | null) => {
        if (stopSelected) {
            dispatch(setTransferStop(null));
        }
        else {
            dispatch(setTransferStop(stop));
        }
    }

    /**
     * Returns a button based on whether the current transfer stop is selected or not
     * @param stop Transfer stop that was clicked on the map
     */
    const getSelectionButton = (stop: TransferStop) => {
        const currentTransferStopSelected = selectedTransferStop?.stopId === stop.stopId;

        return (
            <Button onClick={() => selectTransferStop(currentTransferStopSelected, stop)} color='secondary'
                    size='small' sx={{width: 'auto', alignSelf: 'center'}} variant='contained'>
                { selectedTransferStop?.stopId !== stop.stopId ? "Select as a transfer stop" : "Deselect transfer stop" }
            </Button>
            )
    }

    const dispatch = useAppDispatch();
    return (
        <>
            { transferStops.map((stop) => <CircleMarker key={stop.stopId} center={stop.stopCoords} radius={5} color='green'>
                <Popup closeOnClick={true}>
                    <Stack direction='column' sx={{alignItems: 'center'}}>
                        <h2>{stop.stopName}</h2>
                        {
                            getSelectionButton(stop)
                        }
                    </Stack>
                </Popup>
            </CircleMarker>) }
            <Marker position={selectedTransferStop !== null ? selectedTransferStop.stopCoords : initialCoords}
                    icon={new Icon({iconUrl: markerIconTransfer, iconAnchor: [12, 41]})}/>
        </>
    )
}

export default TransferStopsSelection;
/**
 * @file TransferStopsSelection.tsx
 * @brief Component that shows when the transfer stop on a map is clicked.
 * Shows basic info about the transfer stop and allows the user to select or deselect it
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {CircleMarker, Marker, Popup} from "react-leaflet";
import { Button, Stack, Tooltip } from "@mui/material";
import type { TransferStop } from "../../../types/TransferStop";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { setTransferStop, initialCoords } from "../store/slices/tripSlice";
import { getParkingLotsNearby } from "../store/slices/transferStopSlice";
import { WarningAmber } from "@mui/icons-material";

import markerIconTransfer from '../img/marker-icon-orange.png'
import {Icon} from "leaflet";
import { useTranslation } from "react-i18next";

function TransferStopsSelection() {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops);
    const selectedTransferStop = useAppSelector((state) => state.trip.tripRequest.preferences.transferStop);
    const parkingLotsLoading = useAppSelector((state) => state.transferStop.parkingLotsLoading);

    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    /**
     * Selects and deselects the transfer stop based on stopSelected parameter
     * @param stopSelected Boolean saying if the current transfer stop is selected at the moment
     * @param stop Transfer stop to select
     */
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
                { selectedTransferStop?.stopId !== stop.stopId ? t('transfer.select') : t('transfer.deselect') }
            </Button>
            )
    }
    return (
        <>
            { transferStops.map((stop) =>
                    <CircleMarker key={stop.stopId} center={stop.stopCoords} radius={5} color='green'>
                        <Popup closeOnClick={true}>
                            <Stack direction='column' sx={{alignItems: 'center', gap: '5px'}}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                    <h2 style={{ textAlign: 'center' }}>{stop.stopName}</h2>
                                    { !stop.hasParking &&
                                        <Tooltip sx={{ alignSelf: 'center' }} title={t('preferences.noParkingLots')} placement='right'>
                                            <WarningAmber color='warning'/>
                                        </Tooltip>
                                    }
                                </div>
                                {
                                    getSelectionButton(stop)
                                }
                                <Button onClick={() => dispatch(getParkingLotsNearby(stop.stopId))}
                                        color='secondary' size='small' sx={{width: 'auto', alignSelf: 'center'}} variant='contained' loading={parkingLotsLoading} loadingPosition='end'>
                                    { t('transfer.showParkingLots') }
                                </Button>
                            </Stack>
                        </Popup>
                    </CircleMarker>
            )}
            <Marker position={selectedTransferStop !== null ? selectedTransferStop.stopCoords : initialCoords}
                    icon={new Icon({iconUrl: markerIconTransfer, iconAnchor: [12, 41]})}/>
        </>
    )
}

export default TransferStopsSelection;
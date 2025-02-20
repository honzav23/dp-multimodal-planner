import {List, Collapse, ListItemButton, ListItemText, Typography} from '@mui/material';
import {useAppSelector, useAppDispatch} from "../store/hooks";
import { setSelectedTrip } from "../store/slices/tripSlice";

import { formatDateTime } from "../common/common";
import { LocationOn, SwapHoriz, ChevronLeft, ChevronRight} from "@mui/icons-material";
import TripDetail from "./TripDetail";

import { useState } from 'react';

function TripsSummary() {

    const trips = useAppSelector((state) => state.trip.tripResults)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)

    const showCollapse = selectedTrip !== -1

    const dispatch = useAppDispatch();


    const convertSecondsToHoursAndMinutes = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds - hours * 3600) / 60 );

        if (hours === 0) {
            return `${minutes} min`
        }
        return `${hours} h ${minutes} min`
    }

    return (trips.length > 0 ?
        <div
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                fontSize: '1em',
                maxHeight: '45vh',
                pointerEvents: 'auto',
                display: 'flex',
                width: showCollapse ? '100%' : '50%',
                padding: '0'
            }}
        >
            <List sx={{width: showCollapse ? '50%' : '100%', overflow: 'auto', scrollbarWidth: 'thin', padding: '0 10px' }} component="nav">
            { trips.map((trip, idx) => {
                return (
                    <ListItemButton onClick={() => dispatch(setSelectedTrip(idx))} selected={false} dense divider={idx !== trips.length - 1}>
                        <ListItemText
                            primary={
                                <Typography variant='body1' sx={{fontWeight: 'bold'}}>
                                    {formatDateTime(trip.startTime)} - {formatDateTime(trip.endTime)} ({convertSecondsToHoursAndMinutes(trip.totalTime)})
                                </Typography>
                            }
                            secondary={
                                <>
                                    <Typography component='span' variant="body2">
                                        <SwapHoriz style={{ verticalAlign: "middle" }} /> { trip.totalTransfers } transfers
                                    </Typography>
                                    <br/>
                                    <Typography component='span' variant="body2">
                                        <LocationOn style={{ verticalAlign: "middle" }} /> {(trip.totalDistance / 1000).toFixed(1)} km
                                    </Typography>
                                </>
                            }
                        />
                        {selectedTrip === idx ? <ChevronLeft fontSize='large' /> : <ChevronRight fontSize='large'/>}
                    </ListItemButton>
                )
            }) }
            </List>
            <Collapse in={showCollapse} timeout="auto" unmountOnExit orientation='horizontal'>
                <TripDetail trip={trips[selectedTrip] ?? null}/>
            </Collapse>
        </div>
        :
        <></>
    );
};

export default TripsSummary;
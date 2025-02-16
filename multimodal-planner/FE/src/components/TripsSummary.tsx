import {List, Collapse, ListItemButton, ListItemText, Typography} from '@mui/material';
import {useAppSelector, useAppDispatch} from "../store/hooks";
import { setSelectedTrip } from "../store/slices/tripSlice";

import { formatDateTime } from "../common/common";
import {ExpandMore, LocationOn, SwapHoriz} from "@mui/icons-material";
import React from "react";
import ExpandLess from "@mui/icons-material/ExpandLess";
import TripDetail from "./TripDetail";

function TripsSummary() {

    const trips = useAppSelector((state) => state.trip.tripResults)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)

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
                overflow: 'auto',
                gap: "5px",
                fontSize: '1em',
                maxHeight: '40vh',
                pointerEvents: 'auto'
            }}
        >
            <List component="nav">
            { trips.map((trip, idx) => {
                return (
                    <>
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
                        {selectedTrip === idx ? <ExpandLess/> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={selectedTrip === idx} timeout="auto" unmountOnExit>
                       <TripDetail trip={trip}/>
                    </Collapse>
                    </>
                )
            }) }
            </List>
            </div>
            :
            <></>
    );
};

export default TripsSummary;
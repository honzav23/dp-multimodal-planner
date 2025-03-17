import {List, Collapse, ListItemText, Typography, IconButton, Divider, Box, ListItem, Tabs, Tab} from '@mui/material';
import {useAppSelector, useAppDispatch} from "../store/hooks";
import { setSelectedTrip, clearTripsAndRoutes } from "../store/slices/tripSlice";
import {useEffect, useState, SyntheticEvent} from "react";
import { formatDateTime } from "../common/common";
import {LocationOn, SwapHoriz, ChevronLeft, ChevronRight, ArrowBack, ZoomOutMap, Minimize} from "@mui/icons-material";
import TripDetail from "./TripDetail/TripDetail";
import useIsMobile from '../hooks/useIsMobile';

import { useTranslation } from "react-i18next";

interface TripSummaryProps {
    changeHeight?: (minimize: boolean) => void;
    switchRoutes: (value: string) => void;
}

function TripsSummary({ changeHeight, switchRoutes }: TripSummaryProps) {

    const isMobile = useIsMobile()
    const { outboundTrips, returnTrips } = useAppSelector((state) => state.trip.tripResults)

    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)
    const dispatch = useAppDispatch();

    const [tabValue, setTabValue] = useState('outbound');
    const tripsToShow = tabValue === 'outbound' ? outboundTrips : returnTrips;

    useEffect(() => {
        if (selectedTrip === -1 && !isMobile && outboundTrips.length > 0) {
            dispatch(setSelectedTrip(0))
        }
    }, [outboundTrips]);
    const showCollapse = selectedTrip !== -1

    const [minimized, setMinimized] = useState(false);

    const { t } = useTranslation();

    const convertSecondsToHoursAndMinutes = (seconds: number): string => {
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.round((seconds - hours * 3600) / 60 );

        if (minutes === 60) {
            minutes = 0;
            hours++
        }

        if (hours === 0) {
            return `${minutes} min`
        }
        return `${hours} h ${minutes} min`
    }

    /**
     * Gets correct transfer word based on the number of transfers (for example 1 transfer but 2 transfers)
     * @param totalTransfers 
     * @returns Correct transfer word
     */
    const getTransferTranslation =  (totalTransfers: number): string => {
        if (totalTransfers === 1) {
            return t('transfer.transferSingular')
        }
        else if (totalTransfers === 2 || totalTransfers === 3 || totalTransfers === 4) {
            return t('transfer.transfer234')
        }
        return t('transfer.transferPlural')
    }

    const changeSummaryHeight = (minimize: boolean) => {
       setMinimized(minimize)
        if (changeHeight) {
            changeHeight(minimize)
        }
    }

    const backToTrips = () => {
        setMinimized(false);
        changeSummaryHeight(false)
        // Go from trip detail to trip summary
        if (selectedTrip !== -1) {
            dispatch(setSelectedTrip(-1))
        }

        // Go from trip summary to trip planning
        else {
            dispatch(clearTripsAndRoutes())
        }

    }

    const handleTabChange = (e: SyntheticEvent, val: string) => {
        dispatch(setSelectedTrip(-1))
        setTabValue(val)
        switchRoutes(val)
    }

    return (outboundTrips.length > 0 ?
        <>
            {isMobile &&
                    <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                    <IconButton color='primary' edge='end' onClick={backToTrips}>
                        <ArrowBack/>
                    </IconButton>
                    {
                        minimized ?
                            <IconButton onClick={() => changeSummaryHeight(false)} color='primary' edge='start'>
                                <ZoomOutMap/>
                            </IconButton>
                            :
                            <IconButton onClick={() => changeSummaryHeight(true)} color='primary' edge='start'>
                                <Minimize/>
                            </IconButton>
                    }
                </Box>
            }
            <Divider/>
            <div style={{width: showCollapse ? '50%' : '100%', overflow: 'auto', scrollbarWidth: 'thin', padding: '0 10px', display: (showCollapse && isMobile) ? 'none' : 'block'  }}>
                <Tabs value={tabValue} centered color='error' onChange={handleTabChange}>
                    <Tab value='outbound' sx={{ fontWeight: 'bold', fontSize: '1rem', textTransform: 'none' }} label={t('outbound')} />
                    <Tab value='return' sx={{ fontWeight: 'bold', fontSize: '1rem', textTransform: 'none' }} label={t('return')}/>
                </Tabs>
                <List component="nav">
                { tripsToShow.map((trip, idx) => {
                    return (
                        <ListItem key={idx} sx={{ backgroundColor: selectedTrip === idx ? '#bdbdbd' : 'inherit' }} onClick={() => dispatch(setSelectedTrip(idx))} dense divider={idx !== tripsToShow.length - 1}>
                            <ListItemText
                                primary={
                                    <Typography variant='body1' sx={{fontWeight: 'bold'}}>
                                        {formatDateTime(trip.startTime)} - {formatDateTime(trip.endTime)} ({convertSecondsToHoursAndMinutes(trip.totalTime)})
                                    </Typography>
                                }
                                secondary={
                                    <>
                                        <Typography component='span' variant="body2">
                                            <SwapHoriz style={{ verticalAlign: "middle" }} /> {`${trip.totalTransfers} ${getTransferTranslation(trip.totalTransfers)}`}
                                        </Typography>
                                        <br/>
                                        <Typography component='span' variant="body2">
                                            <LocationOn style={{ verticalAlign: "middle" }} /> {(trip.totalDistance / 1000).toFixed(1)} km
                                        </Typography>
                                    </>
                                }
                            />
                            {selectedTrip === idx ? <ChevronLeft fontSize='large' /> : <ChevronRight fontSize='large'/>}
                        </ListItem>
                    )
                }) }
                </List>
            </div>
                <Collapse in={showCollapse} timeout="auto" unmountOnExit orientation='horizontal'>
                        <TripDetail trip={tripsToShow[selectedTrip] ?? null}/>
                </Collapse>
        </>
        :
        <></>
    );
};

export default TripsSummary;
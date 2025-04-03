/**
 * @file TripsSummary.tsx
 * @brief Component for showing all calculated trips with summary info (time, transfers, ...).
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import {
    List,
    Collapse,
    ListItemText,
    Typography,
    IconButton,
    Divider,
    Box,
    ListItem,
    Tabs,
    Tab,
    Tooltip
} from '@mui/material';
import {useAppSelector, useAppDispatch} from "../store/hooks";
import { setSelectedTrip, clearTripsAndRoutes } from "../store/slices/tripSlice";
import {useEffect, useState, SyntheticEvent, useRef} from "react";
import { formatDateTime } from "../common/common";
import {LocationOn, SwapHoriz, ChevronLeft, ChevronRight, ArrowBack, ZoomOutMap,
    Minimize, EnergySavingsLeaf, DirectionsRun, KeyboardArrowUp} from "@mui/icons-material";
import TripDetail from "./TripDetail/TripDetail";
import SortIcon from './SortIcon'
import useIsMobile from '../hooks/useIsMobile';

import { useTranslation } from "react-i18next";
import {SortState, SortInfo} from "../types/SortState.ts";

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

    const [sortTimeState, setSortTimeState] = useState<SortInfo>({ sortState: 'none', forcedState: null, selected: false })
    const [sortEmissionsState, setSortEmissionsState] = useState<SortInfo>({ sortState: 'none', forcedState: null, selected: false })

    const scrollRef = useRef(null)
    let tripsToShow = tabValue === 'outbound' ? [...outboundTrips] : [...returnTrips];

    if (sortTimeState.sortState !== 'none' || sortEmissionsState.sortState !== 'none') {
        tripsToShow = tripsToShow.sort((a, b) => {
            if (sortTimeState.sortState !== 'none') {
                return sortTimeState.sortState === "desc" ? b.totalTime - a.totalTime : a.totalTime - b.totalTime;
            }
            else {
                return sortEmissionsState.sortState === 'desc' ? b.totalEmissions - a.totalEmissions : a.totalEmissions - b.totalEmissions;
            }
        });
    }

    // Whenever the trips are fetched, select by default the first one
    useEffect(() => {
        if (selectedTrip === -1 && !isMobile && outboundTrips.length > 0) {
            dispatch(setSelectedTrip(0))
        }
    }, [outboundTrips]);

    // When a new trip is selected scroll to the top
    useEffect(() => {
        if (scrollRef && scrollRef.current) {
            scrollRef.current.scrollTop = 0
        }
    }, [selectedTrip])

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

    /**
     * Changes the height of summary component when in mobile mode
     * @param minimize Whether to minimize the component or not
     */
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

    /**
     * Change the sort state based on the state coming from the origin
     * @param state The state that changed
     * @param origin Where the change comes from
     */
    const handleSortStateChange = (state: SortState, origin: string) => {
        if (origin === 'time') {
            setSortTimeState({sortState: state, selected: state !== 'none', forcedState: null})
            setSortEmissionsState({sortState: 'none', forcedState: 'none', selected: false})
        }
        else {
            setSortEmissionsState({sortState: state, selected: state !== 'none', forcedState: null})
            setSortTimeState({sortState: 'none', forcedState: 'none', selected: false})
        }
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
                {/* Tabs for changing between outbound trips and return trips */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                    <Tabs value={tabValue} color='error' onChange={handleTabChange}>
                        <Tab value='outbound' sx={{ fontWeight: 'bold', fontSize: '1rem', textTransform: 'none' }} label={t('outbound')} />
                        { returnTrips.length > 0 && <Tab value='return' sx={{ fontWeight: 'bold', fontSize: '1rem', textTransform: 'none' }} label={t('return')}/> }
                    </Tabs>

                    {/* Sorting */}
                    <Box sx={{ alignSelf: 'flex-end' }}>
                        <SortIcon sortStateChanged={(st) => handleSortStateChange(st, "time")}  mainIcon={<DirectionsRun/>} sortInfo={sortTimeState}/>
                        <SortIcon sortStateChanged={(st) => handleSortStateChange(st, "emissions")} mainIcon={<EnergySavingsLeaf/>} sortInfo={sortEmissionsState} />
                    </Box>
                </div>
                <List component="nav">
                { tripsToShow.map((trip, idx) => {
                    return (
                        <ListItem key={idx} sx={{ backgroundColor: selectedTrip === idx ? '#bdbdbd' : 'inherit' }} onClick={() => dispatch(setSelectedTrip(idx))} dense divider={idx !== tripsToShow.length - 1}>
                            <ListItemText
                                primary={
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Typography variant='body1' sx={{fontWeight: 'bold'}}>
                                            {formatDateTime(trip.startTime)} - {formatDateTime(trip.endTime)} ({convertSecondsToHoursAndMinutes(trip.totalTime)})
                                        </Typography>

                                        {/* Show the leaf icon when a trip is the fastest */}
                                        { trip.lowestTime &&
                                            <Tooltip title={t('fastest')} placement='right'>
                                                <DirectionsRun sx={{ color: 'darkBlue' }}/>
                                            </Tooltip>
                                        }

                                        {/* Show the leaf icon when a trip is the most eco-friendly */}
                                        { trip.lowestEmissions &&
                                            <Tooltip title={t('eco')} placement='right'>
                                                <EnergySavingsLeaf sx={{ color: '#008000' }}/>
                                            </Tooltip>
                                        }
                                    </div>
                                }
                                secondary={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap-reverse', gap: '10px' }}>
                                        <div>
                                            <Typography component='span' variant="body2">
                                                <SwapHoriz style={{ verticalAlign: "middle" }} /> {`${trip.totalTransfers} ${getTransferTranslation(trip.totalTransfers)}`}
                                            </Typography>
                                            <br/>
                                            <Typography component='span' variant="body2">
                                                <LocationOn style={{ verticalAlign: "middle" }} /> {(trip.totalDistance / 1000).toFixed(1)} km
                                            </Typography>
                                        </div>
                                        { trip.via !== '' && 
                                            <div>
                                                <Typography variant='body1'>
                                                    {t('via')} <strong>{trip.via}</strong>
                                                </Typography>
                                            </div>
                                        }
                                    </div>
                                }
                            />
                            {selectedTrip === idx ? <ChevronLeft fontSize='large' /> : <ChevronRight fontSize='large'/>}
                        </ListItem>
                    )
                }) }
                </List>
            </div>
                {/* Show the trip detail when clicking at one of the trips */}
                <Collapse ref={scrollRef} sx={{ overflow: 'auto', scrollbarWidth: 'thin', maxWidth: '50%' }} in={showCollapse} timeout="auto" unmountOnExit orientation='horizontal'>
                        <TripDetail trip={tripsToShow[selectedTrip] ?? null}/>
                </Collapse>
        </>
        :
        <></>
    );
};

export default TripsSummary;
/**
 * @file TripsSummary.tsx
 * @brief Component for showing all calculated trips with summary info (time, transfers, ...).
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {
    List,
    Collapse,
    IconButton,
    Divider,
    Box,
    Tabs,
    Tab,
} from '@mui/material';
import {useAppSelector, useAppDispatch} from "../store/hooks";
import { setSelectedTrip, clearTrips, setShowOutboundTrips } from "../store/slices/tripSlice";
import {useEffect, useState, SyntheticEvent, useRef} from "react";
import {ArrowBack, ZoomOutMap, Minimize, EnergySavingsLeaf, Speed} from "@mui/icons-material";
import TripDetail from "./TripDetail/TripDetail";
import TripSummaryItem from "./TripSummaryItem";
import SortIcon from './SortIcon'
import useIsMobile from '../hooks/useIsMobile';
import { useSwapAddresses } from "../hooks/useSwapAddress.ts";

import { useTranslation } from "react-i18next";
import {SortState, SortInfo} from "../types/SortState.ts";
import styles from '../css/styles.module.css'

interface TripSummaryProps {
    minimize?: (origin: string) => void;
    maximize?: (origin: string) => void;
}

function TripsSummary({ minimize, maximize }: TripSummaryProps) {

    const isMobile = useIsMobile()
    const { outboundTrips, returnTrips } = useAppSelector((state) => state.trip.tripResults)

    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)
    const dispatch = useAppDispatch();

    const [tabValue, setTabValue] = useState('outbound');
    const swapOriginAndDestination = useSwapAddresses()

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
        if (selectedTrip === null && !isMobile && outboundTrips.length > 0) {
            setTabValue('outbound');
            setShowOutboundTrips(true)
            dispatch(setSelectedTrip(outboundTrips[0]))
        }
    }, [outboundTrips]);

    // When a new trip is selected scroll to the top
    useEffect(() => {
        if (scrollRef && scrollRef.current) {
            (scrollRef.current as HTMLElement).scrollTop = 0
        }
    }, [selectedTrip])

    const showCollapse = selectedTrip !== null
    const [minimized, setMinimized] = useState(false);
    const { t } = useTranslation();

    /**
     * Minimize only if the function is defined
     */
    const conditionalMinimize = () => {
        if (minimize) {
            setMinimized(true)
            minimize("summary")
        }
    }

    /**
     * Maximize only if the function is defined
     */
    const conditionalMaximize = () => {
        if (maximize) {
            setMinimized(false)
            maximize("summary")
        }
    }

    const backToTrips = () => {
        setMinimized(false);
        conditionalMaximize()
        // Go from trip detail to trip summary
        if (selectedTrip !== null) {
            dispatch(setSelectedTrip(null))
        }

        // Go from trip summary to trip planning
        else {
            dispatch(clearTrips())
        }
    }

    const handleTabChange = (e: SyntheticEvent, val: string) => {
        dispatch(setSelectedTrip(null))
        setTabValue(val)
        dispatch(setShowOutboundTrips(val === 'outbound'))
        swapOriginAndDestination()
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
                            <IconButton onClick={conditionalMaximize} color='primary' edge='start'>
                                <ZoomOutMap/>
                            </IconButton>
                            :
                            <IconButton onClick={conditionalMinimize} color='primary' edge='start'>
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
                        <Tab className={styles.tab} value='outbound' label={t('outbound')} />
                        <Tab className={styles.tab} value='return' disabled={returnTrips.length === 0} label={t('return')}/>
                    </Tabs>

                    {/* Sorting */}
                    <Box sx={{ alignSelf: 'flex-end' }}>
                        <SortIcon sortStateChanged={(st) => handleSortStateChange(st, "time")}  mainIcon={<Speed/>} sortInfo={sortTimeState}/>
                        <SortIcon sortStateChanged={(st) => handleSortStateChange(st, "emissions")} mainIcon={<EnergySavingsLeaf/>} sortInfo={sortEmissionsState} />
                    </Box>
                </div>
                <List component="nav">
                { tripsToShow.map((trip, idx) =>
                    <TripSummaryItem key={trip.uuid} trip={trip} tripIdx={idx} tripsToShowLength={tripsToShow.length}/>
                )}
                </List>
            </div>
                {/* Show the trip detail when clicking at one of the trips */}
                <Collapse ref={scrollRef} sx={{ overflow: 'auto', scrollbarWidth: 'thin', maxWidth: isMobile ? '100%' : '50%' }} in={showCollapse} timeout="auto" unmountOnExit orientation='horizontal'>
                        <TripDetail trip={selectedTrip}/>
                </Collapse>
        </>
        :
        <></>
    );
}

export default TripsSummary;
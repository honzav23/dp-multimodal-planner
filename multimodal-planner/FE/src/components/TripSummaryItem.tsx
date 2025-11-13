import {ListItem, ListItemText, Tooltip, Typography} from "@mui/material";
import {setSelectedTrip} from "../store/slices/tripSlice.ts";
import {formatDateTime} from "../common/common.ts";
import CrownIcon from "../img/CrownIcon.tsx";
import {ChevronLeft, ChevronRight, EnergySavingsLeaf, LocationOn, Speed, SwapHoriz} from "@mui/icons-material";
import type {TripResultWithIdConvertedRoute} from "../../../types/TripResult.ts";
import {useAppSelector, useAppDispatch} from "../store/hooks.ts";
import { useTranslation } from "react-i18next";

interface TripSummaryItemProps {
    trip: TripResultWithIdConvertedRoute;
    tripIdx: number;
    tripsToShowLength: number;
}

function TripSummaryItem({ trip, tripIdx, tripsToShowLength }: TripSummaryItemProps) {
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)
    const dispatch = useAppDispatch();
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

    const handleTripItemClick = () => {
        // Deselect the trip if it is already selected
        if (selectedTrip !== null && selectedTrip.uuid === trip.uuid) {
            dispatch(setSelectedTrip(null))
        }
        else {
            dispatch(setSelectedTrip(trip))
        }
    }

    return (
        <ListItem sx={{ backgroundColor: selectedTrip !== null && selectedTrip.uuid === trip.uuid ? '#bdbdbd' : 'inherit' }} onClick={handleTripItemClick} dense divider={tripIdx !== tripsToShowLength - 1}>
            <ListItemText
                disableTypography
                primary={
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Typography variant='body1' sx={{fontWeight: 'bold'}}>
                            {formatDateTime(trip.startTime)} - {formatDateTime(trip.endTime)} ({convertSecondsToHoursAndMinutes(trip.totalTime)})
                        </Typography>

                        {/* Show the crown icon when a trip has the best score */}
                        { trip.bestOverall &&
                            <Tooltip title={t('best')} placement='right'>
                                <div>
                                    <CrownIcon/>
                                </div>
                            </Tooltip>
                        }

                        {/* Show the speed icon when a trip is the fastest */}
                        { trip.lowestTime &&
                            <Tooltip title={t('fastest')} placement='right'>
                                <Speed sx={{ color: 'darkBlue' }}/>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap-reverse', gap: '10px', color: 'rgba(0, 0, 0, 0.6)' }}>
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
            {selectedTrip !== null && selectedTrip.uuid === trip.uuid ? <ChevronLeft fontSize='large' /> : <ChevronRight fontSize='large'/>}
        </ListItem>
    )
}

export default TripSummaryItem
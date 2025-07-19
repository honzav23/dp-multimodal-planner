/**
 * @file TripDetailLeg.tsx
 * @brief Component for showing the individual trip leg with necessary information
 * about the leg
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { ListItem, Stack, Typography, Icon, Box, Chip, Popover, Tooltip } from '@mui/material'
import { useState, MouseEvent } from 'react'
import {DelaysForLeg, TripLeg} from '../../../../types/TripResult'
import LegDelayTable from "./LegDelayTable";
import { formatDateTime } from "../../common/common";
import { DirectionsCar, DirectionsBus, Train, Tram, QuestionMark, DirectionsWalk, DirectionsSubway } from '@mui/icons-material'
import TrolleybusIcon from '../../img/TrolleybusIcon';
import { routeColors } from '../../common/common';
import { TransportMode } from '../../../../types/TransportMode';
import { useTranslation } from 'react-i18next';

interface TripDetailLegProps {
    leg: TripLeg,
    idx: number,
    totalLegs: number
}

function TripDetailLeg({ leg, idx, totalLegs }: TripDetailLegProps) {

    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)
    const { t } = useTranslation()

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;

    /**
     * Returns the icon based on the mode of transport
     * @param mode Mode of transport
     * @returns Icon component
     */
    const getIconBasedOnMeansOfTransport = (mode: string) => {
        switch (mode) {
            case "car":
                return DirectionsCar
            case "bus":
                return DirectionsBus
            case "rail":
                return Train
            case "tram":
                return Tram
            case "foot":
                return DirectionsWalk
            case "trolleybus":
                return TrolleybusIcon
            case "metro":
                return DirectionsSubway
            default:
                return QuestionMark;
        }
    }
    /**
     * Formats the line based on if present or not
     * @param line The line to format
     */
    const formatLine = (line: string): string => {
        if (!line) {
            return '';
        }
        return `(${line})`
    }

    /**
     * Translates the leg name in case the name is Origin or Destination
     * @param legName Name of the leg to translate
     */
    const translateLegName = (legName: string): string =>{
        if (legName === "Origin" || legName === "Destination" || legName === "Pickup") {
            return t(`${legName.toLowerCase()}`)
        }
        return legName
    }

    const getDelayNumber = (delays: DelaysForLeg): number => {
        return leg.delays.currentDelay === -1 ? leg.delays.averageDelay : leg.delays.currentDelay
    }

    const getChipColor = (delays: DelaysForLeg): 'success' | 'error' => {
        if (delays.currentDelay !== -1) {
            return delays.currentDelay === 0 ? 'success' : 'error'
        }
        return delays.averageDelay === 0 ? 'success' : 'error'
    }

    const getTooltipTitle = (delays: DelaysForLeg): string => {
        return delays.currentDelay === -1 ? t('averageDelay') : t('currentDelay')
    }

    return (
        <ListItem
            key={leg.startTime}
            dense
            divider={idx !== totalLegs - 1}
            sx={{
                bgcolor: "#FFFFFF",
                // Change the color and appearance of the left border depending on the mode of transport used
                borderLeft: `4px ${leg.modeOfTransport === 'car' ? 'dashed' : 'solid'} ${routeColors[leg.modeOfTransport as TransportMode]}`,
                borderRadius: 2,
                p: 1.5,
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
            }}
        >
            <Stack direction="column" spacing={0.5} sx={{ width: "100%" }}>
                {/* Time Range */}
                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                    <Typography variant="body2" sx={{ color: "#546E7A" }}>
                        {formatDateTime(leg.startTime)} - {formatDateTime(leg.endTime)}
                    </Typography>
                    { (leg.delays.pastDelays.length > 0 || leg.delays.currentDelay !== -1) &&
                        <>
                            <Tooltip title={ getTooltipTitle(leg.delays) } arrow placement='right'>
                                <Chip sx={{ border: leg.delays.currentDelay !== -1 ? '2px solid #ffa500' : 'inherit' }} size='small' label={`+${getDelayNumber(leg.delays)} min`} color={getChipColor(leg.delays)} onClick={handleClick}/>
                            </Tooltip>
                            { leg.delays.pastDelays.length > 0 &&
                                <Popover open={open} id={id} anchorEl={anchorEl} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }} anchorOrigin={{vertical: 'top', horizontal: 'right'}} onClose={handleClose}>
                                    <LegDelayTable delays={leg.delays.pastDelays}/>
                                </Popover>
                            }
                        </>
                    }
                </Box>

                {/* Transport Details */}
                <Stack direction="row" spacing={1} alignItems="center">
                    <Icon
                        component={getIconBasedOnMeansOfTransport(leg.modeOfTransport)}
                        sx={{ fontSize: 28, color: "primary" }}
                    />
                    <Typography variant="subtitle2">
                        <strong>{formatLine(leg.line)}</strong>{" "}
                        <Typography component="span" variant="subtitle1" fontWeight="bold" sx={{ color: "#37474F" }}>
                            {translateLegName(leg.from)}
                        </Typography>
                        <Typography component="span" variant="subtitle2" sx={{ color: "#78909C" }}>
                            {" "}→{" "}
                        </Typography>
                        <Typography component="span" variant="subtitle1" fontWeight="bold" sx={{ color: "#37474F" }}>
                            {translateLegName(leg.to)}
                        </Typography>
                    </Typography>
                </Stack>
            </Stack>
        </ListItem>
    )
}

export default TripDetailLeg
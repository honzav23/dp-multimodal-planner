import { ListItem, Stack, Typography, Icon, Box, Chip, Popover } from '@mui/material'
import { useState, MouseEvent } from 'react'
import { TripLeg } from '../../../../types/TripResult'
import LegDelayTable from "./LegDelayTable";
import { formatDateTime } from "../../common/common";
import { DirectionsCar, DirectionsBus, Train, Tram, QuestionMark, DirectionsWalk } from '@mui/icons-material'
import TrolleybusIcon from '../../img/TrolleybusIcon';

interface TripDetailLegProps {
    leg: TripLeg,
    idx: number,
    totalLegs: number
}

function TripDetailLeg({ leg, idx, totalLegs }: TripDetailLegProps) {

    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null)

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


    return (
        <ListItem
            key={leg.startTime}
            dense
            divider={idx !== totalLegs - 1}
            sx={{
                bgcolor: "#FFFFFF",
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
                    { leg.delayInfo.length > 0 &&
                        <>
                            <Chip size='small' label={`+${leg.averageDelay} min`} color={leg.averageDelay > 0 ? 'error' : 'success'} onClick={handleClick}/>
                            <Popover open={open} id={id} anchorEl={anchorEl} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }} anchorOrigin={{vertical: 'top', horizontal: 'right'}} onClose={handleClose}>
                                <LegDelayTable delays={leg.delayInfo}/>
                            </Popover>
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
                            {leg.from}
                        </Typography>
                        <Typography component="span" variant="subtitle2" sx={{ color: "#78909C" }}>
                            {" "}→{" "}
                        </Typography>
                        <Typography component="span" variant="subtitle1" fontWeight="bold" sx={{ color: "#37474F" }}>
                            {leg.to}
                        </Typography>
                    </Typography>
                </Stack>
            </Stack>
        </ListItem>
    )
}

export default TripDetailLeg
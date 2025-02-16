import { ListItem, List, Icon, Stack, Typography, Paper } from '@mui/material'
import type {TripResult} from "../../../types/TripResult";
import { formatDateTime } from "../common/common";

import { DirectionsCar, DirectionsBus, Train, Tram, QuestionMark, DirectionsWalk } from '@mui/icons-material'


interface TripDetailProps {
    trip: TripResult
}
function TripDetail({ trip }: TripDetailProps) {

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
            // TODO add trolleybus and perhaps other icons
            default:
                return QuestionMark;
        }
    }

    const formatLine = (line: string): string => {
        if (!line) {
            return '';
        }
        return `(${line})`
    }

    return (
        <div
            style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                overflow: "scroll",
                gap: "5px",
                fontSize: '1em',
                maxHeight: '40vh'
            }}
        >
            {/* <List>*/}
            {/*     {trip.legs.map((leg, idx) => {*/}
            {/*        return (*/}
            {/*            <ListItem key={leg.startTime} dense divider={idx !== trip.legs.length - 1}>*/}
            {/*                <div style={{*/}
            {/*                    display: 'flex',*/}
            {/*                    flexDirection: 'column',*/}
            {/*                    justifyContent: 'space-between',*/}
            {/*                    gap: '0'*/}
            {/*                }}>*/}
            {/*                    <p style={{margin: 0}}>{formatDateTime(leg.startTime)} - {formatDateTime(leg.endTime)}</p>*/}
            {/*                    <div style={{*/}
            {/*                        display: 'flex',*/}
            {/*                        justifyContent: 'space-between',*/}
            {/*                        alignItems: 'center',*/}
            {/*                        gap: '10px'*/}
            {/*                    }}>*/}
            {/*                        <Icon component={getIconBasedOnMeansOfTransport(leg.modeOfTransport)}/>*/}
            {/*                        <p>{formatLine(leg.line)} {leg.from} &rarr; {leg.to}</p>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </ListItem>*/}
            {/*        )*/}
            {/*    })*/}
            {/*    }*/}
            {/*</List>*/}
            <List
                component={Paper}
                elevation={3}
                sx={{
                    bgcolor: "#ECEFF1", // Soft blue-gray background
                    p: 2,
                   // border: "1px solid #B0BEC5", // Subtle border for separation
                    color: "#37474F" // Dark gray text for readability
                }}
            >
                {trip.legs.map((leg, idx) => (
                    <ListItem
                        key={leg.startTime}
                        dense
                        divider={idx !== trip.legs.length - 1}
                        sx={{
                            bgcolor: "#FFFFFF", // White background for trip legs
                            borderRadius: 2,
                            p: 1.5,
                            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" // Soft shadow for depth
                        }}
                    >
                        <Stack direction="column" spacing={0.5} sx={{ width: "100%" }}>
                            {/* Time Range */}
                            <Typography variant="body2" sx={{ color: "#546E7A" }}>
                                {formatDateTime(leg.startTime)} - {formatDateTime(leg.endTime)}
                            </Typography>

                            {/* Transport Details */}
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Icon
                                    component={getIconBasedOnMeansOfTransport(leg.modeOfTransport)}
                                    sx={{ fontSize: 28, color: "primary" }} // Soft blue icon
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
                ))}
            </List>
        </div>
    )
}

export default TripDetail;
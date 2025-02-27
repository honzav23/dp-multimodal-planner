import { ListItem, Stack, Typography, Icon } from '@mui/material'
import { TripLeg } from '../../../../types/TripResult'
import { formatDateTime } from "../../common/common";
import { DirectionsCar, DirectionsBus, Train, Tram, QuestionMark, DirectionsWalk } from '@mui/icons-material'

interface TripDetailLegProps {
    leg: TripLeg,
    idx: number,
    totalLegs: number
}

function TripDetailLeg({ leg, idx, totalLegs }: TripDetailLegProps) {

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
                <Typography variant="body2" sx={{ color: "#546E7A" }}>
                    {formatDateTime(leg.startTime)} - {formatDateTime(leg.endTime)}
                </Typography>

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
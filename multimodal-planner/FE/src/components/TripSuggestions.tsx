import {Divider, Icon, List, ListItem} from '@mui/material';
import {useAppSelector} from "../store/hooks";

import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import TrainIcon from '@mui/icons-material/Train';
import TramIcon from '@mui/icons-material/Tram';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

function TripSuggestions() {

    const trips = useAppSelector((state) => state.trip.tripResults)

    const getIconBasedOnMeansOfTransport = (mode: string) => {
        switch (mode) {
            case "car":
                return DirectionsCarIcon
            case "bus":
                return DirectionsBusIcon
            case "train":
                return TrainIcon
            case "tram":
                return TramIcon
            // TODO add trolleybus and perhaps other icons
            default:
                return QuestionMarkIcon;
        }
    }

    const formatDateTime = (dateTime: string): string => {
        const date = new Date(dateTime);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        const hoursString = hours.toString().padStart(2, '0');
        const minutesString = minutes.toString().padStart(2, '0');

        return `${hoursString}:${minutesString}`;
    }

    const formatLine = (line: string): string => {
        if (!line) {
            return '';
        }
        return `(${line})`
    }

    return (trips.length > 0 ?
            <div
                style={{
                    width: "340px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    fontSize: '1em'
                }}
            >
                <List>
                    {trips[0].legs.map((leg) => {
                        return (
                            <div key={leg.startTime}>
                                <ListItem>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '0'
                                    }}>
                                        <p style={{margin: 0}}>{formatDateTime(leg.startTime)} - {formatDateTime(leg.endTime)}</p>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <Icon component={getIconBasedOnMeansOfTransport(leg.modeOfTransport)}/>
                                            <p>{formatLine(leg.line)} {leg.from} &rarr; {leg.to}</p>
                                        </div>
                                    </div>
                                </ListItem>
                                <Divider/>
                            </div>
                        )
                    })
                    }
                </List>
            </div> :
            <></>
    );
};

export default TripSuggestions;
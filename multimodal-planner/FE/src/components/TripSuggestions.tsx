import { testTrip } from '../testData/TestTrip'
import { Divider, Icon, List, ListItem } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import TrainIcon from '@mui/icons-material/Train';
import TramIcon from '@mui/icons-material/Tram';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

function TripSuggestions() {


    const getIconBasedOnMeansOfTransport = (mode: string) => {
        switch(mode) {
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

    return (
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
                { testTrip.trip.map((trip) => {
                    return (
                        <>
                            <ListItem key={trip.startTime}>
                                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0'}}>
                                    <p style={{margin: 0}}>{trip.startTime} - {trip.endTime}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                        <Icon component={getIconBasedOnMeansOfTransport(trip.modeOfTransport)}/>
                                        <p>({trip.line}) {trip.from} &rarr; {trip.to}</p>
                                    </div>
                                </div>
                            </ListItem>
                            <Divider/>
                        </>
                    )
                }) 
                }
            </List>
        </div>
    );
};

export default TripSuggestions;
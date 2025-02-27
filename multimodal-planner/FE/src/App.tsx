import './App.css';
import {MapContainer, TileLayer, Polyline, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import PositionSelection from './components/PositionSelection';
import TransferStopsSelection from './components/TransferStopsSelection';
import TripRequestForm from './components/TripRequestForm';
import TripsSummary from './components/TripsSummary';
import { useAppSelector } from "./store/hooks";
import ActionFeedback from "./components/ActionFeedback";
import {TransportMode} from "../../types/TransportMode";

import '../i18n.ts'
import TripDetailLeg from './components/TripDetail/TripDetailLeg.tsx';

import {isMobile} from 'react-device-detect';

function App() {

    const trips = useAppSelector((state) => state.trip.tripResults)
    const decodedRoutes = useAppSelector((state) => state.trip.decodedRoutes)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)

    console.log(isMobile)
    const determineRouteColor = (mode: TransportMode): string => {
        switch (mode) {
            case 'car':
                return '#8E44AD'
            
            case 'foot':
                return '#007BFF'

            default:
                return "black"
        }
    }

    return (
        <div style={{position: "relative", width: "100%"}}>
            <div style={{
                height: '90vh',
                width: '36%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'absolute',
                top: "5%",
                left: "5%",
                pointerEvents: 'none',
                zIndex: 1000
            }}>
                <TripRequestForm/>
                <TripsSummary/>
            </div>
            <MapContainer center={[49.195061, 16.606836]} zoom={12} scrollWheelZoom={true} style={{height: '100vh'}}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <PositionSelection/>
                <TransferStopsSelection/>

                {trips.length > 0 && selectedTrip !== -1 && decodedRoutes[selectedTrip].map((leg, i) => {
                    return (
                            <Polyline key={i} positions={leg.route}
                                pathOptions={{color: determineRouteColor(leg.mode), weight: 5, opacity: 0.8}}>
                                <Popup closeOnClick={true}>
                                    <TripDetailLeg leg={trips[selectedTrip].legs[i]} idx={i} totalLegs={trips[selectedTrip].legs.length}/>
                                </Popup>
                            </Polyline>
                    )
                })}

            </MapContainer>
            <ActionFeedback/>
        </div>
    );
}

export default App;

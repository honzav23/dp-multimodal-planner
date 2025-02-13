import './App.css';
import {MapContainer, TileLayer, Polyline, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import decodePolyline from './decodePolyline.ts'
import MarkerWrapper from './components/MarkerWrapper';
import TripRequestForm from './components/TripRequestForm';
import TripSuggestions from './components/TripSuggestions';
import { useAppSelector } from "./store/hooks";
import ActionFeedback from "./components/ActionFeedback";

function App() {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops)

    const trips = useAppSelector((state) => state.trip.tripResults)
    return (
        <div style={{position: "relative", width: "100%"}}>
            <div style={{
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'absolute',
                top: "5%",
                left: "5%",
                zIndex: 1000
            }}>
                <TripRequestForm/>
                <TripSuggestions/>
            </div>
            <MapContainer center={[49.195061, 16.606836]} zoom={12} scrollWheelZoom={true} style={{height: '100vh'}}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarkerWrapper/>

                {trips.length > 0 && trips[0].legs.map((leg => {
                    return (
                            <Polyline key={leg.startTime} positions={decodePolyline(leg.route)}
                                pathOptions={{color: leg.modeOfTransport === "car" ? "#8E44AD " : "black", weight: 5, opacity: 0.8}}>
                                    <Popup>Test popup</Popup>
                            </Polyline>
                    )
                }))}

            </MapContainer>
            <ActionFeedback/>
        </div>
    );
}

export default App;

import './App.css';
import {MapContainer, TileLayer, Polyline, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import decodePolyline from './decodePolyline.ts'
import PositionSelection from './components/PositionSelection';
import TransferStopsSelection from './components/TransferStopsSelection';
import TripRequestForm from './components/TripRequestForm';
import TripsSummary from './components/TripsSummary.tsx';
import { useAppSelector } from "./store/hooks";
import Test from './Test';
import ActionFeedback from "./components/ActionFeedback";
import {TransportMode} from "../../types/TransportMode";

function App() {
    const transferStops = useAppSelector((state) => state.transferStop.transferStops)

    const trips = useAppSelector((state) => state.trip.tripResults)
    const decodedRoutes = useAppSelector((state) => state.trip.decodedRoutes)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)
    return (
        <div style={{position: "relative", width: "100%"}}>
            <div style={{
                height: '90vh',
                width: '19%',
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
                                pathOptions={{color: leg.mode === "car" as TransportMode ? "#8E44AD " : "black", weight: 5, opacity: 0.8}}/>
                    )
                })}

            </MapContainer>
            <ActionFeedback/>
        </div>
        // <Test/>
    );
}

export default App;

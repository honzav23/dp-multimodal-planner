import './App.css';
import {MapContainer, TileLayer, Polyline} from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import decodePolyline from './decodePolyline.ts'
import MarkerWrapper from './components/MarkerWrapper';
import TripRequestForm from './components/TripRequestForm';
import TripSuggestions from './components/TripSuggestions';
import { useAppSelector } from "./store/hooks";
import ActionFeedback from "./components/ActionFeedback";

function App() {
    const x = decodePolyline("srmkH}vedBTCl@Ab@CdAEVC`@EZGJEBAPIFCLGj@]LIDARMNIXQVOnCgBbDmBrAy@HGt@e@ZS`@WLG@ARMLGFEVOACEU[_BACKo@Km@Mi@m@}CEWaCwM?M?E?E@C@EBKBCDCDGHATMNGjCaB@AHEBKF}B?ME[ACCU}@eHCOsAyKEU?CLG~CaBHEVM|@c@@APIRKFEBApAo@pCwA~DsBb@WfAi@`EqB\\QDCHE@Al@YNIDAlAo@fAi@`Ag@PI?AC[}@qFCQESg@mDc@qCFCHA")

    const handleClick = (e: any) => {
        console.log("Clicked on polyline")
    }

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
                    return (<Polyline eventHandlers={{click: handleClick}} positions={decodePolyline(leg.route)}
                              pathOptions={{color: "blue", weight: 5}}/>)
                }))}

            </MapContainer>
            <ActionFeedback/>
        </div>
    );
}

export default App;

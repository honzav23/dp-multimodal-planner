import './App.css';
import {MapContainer, TileLayer, Polyline, Popup} from 'react-leaflet';
import {Drawer, Box} from "@mui/material";
import 'leaflet/dist/leaflet.css'
import PositionSelection from './components/PositionSelection';
import TransferStopsSelection from './components/TransferStopsSelection';
import TripRequestForm from './components/TripRequestForm';
import TripsSummary from './components/TripsSummary';
import { useAppSelector, useAppDispatch } from "./store/hooks";
import ActionFeedback from "./components/ActionFeedback";
import {TransportMode} from "../../types/TransportMode";

import '../i18n.ts'
import TripDetailLeg from './components/TripDetail/TripDetailLeg.tsx';
import useIsMobile from './hooks/useIsMobile';

function App() {
    const trips = useAppSelector((state) => state.trip.tripResults)
    const decodedRoutes = useAppSelector((state) => state.trip.decodedRoutes)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)
    const showCollapse = selectedTrip !== -1

    const isMobile = useIsMobile()

    // Route colors based on the current means of transport
    const routeColors: Record<TransportMode, string> = {
        foot: '#4CAF50',
        car: '#FF0000',
        tram: '#007BFF',
        bus: '#FFD700',
        rail: '#212121',
        trolleybus: '#800080',
    }

    const changeHeight = (minimize: boolean) => {
        if (minimize) {
            document.getElementById('summary').style.maxHeight = '5vh'
        }
        else {
            document.getElementById('summary').style.maxHeight = '60vh'
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

                { isMobile ? (trips.length === 0 &&
                        <Drawer sx={{ pointerEvents: 'none' }} open={true} anchor='bottom' PaperProps={{sx: { boxShadow: '0px -20px 10px rgba(0, 0, 0, 0.2)' }}} hideBackdrop>
                            <Box sx={{
                                pointerEvents: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                m: 1
                            }}>
                                <TripRequestForm/>
                            </Box>
                        </Drawer>
                )
                    :
                    <div
                        style={{
                            padding: "10px 10px",
                            pointerEvents: 'auto',
                            width: '50%',
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                        }}>
                        <TripRequestForm/>
                    </div>                
                }

                { isMobile ? (trips.length > 0 &&
                    <Drawer sx={{ pointerEvents: 'none' }} PaperProps={{sx: { boxShadow: '0px -20px 10px rgba(0, 0, 0, 0.2)' }}} open={true} anchor='bottom' hideBackdrop>
                        <Box id="summary" sx={{
                            fontSize: '1em',
                            maxHeight: '50vh',
                            pointerEvents: 'auto',
                            display:'flex',
                            flexDirection: 'column',
                        }}>
                            <TripsSummary changeHeight={changeHeight}/>
                        </Box>
                    </Drawer>)
                    :
                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            fontSize: '1em',
                            maxHeight: '45vh',
                            pointerEvents: 'auto',
                            display: 'flex',
                            width: showCollapse ? '100%' : '50%',
                            padding: '0'
                        }}>
                        <TripsSummary/>
                    </div>
                }

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
                                pathOptions={{color: routeColors[leg.mode], weight: 5, opacity: 0.8}} dashArray={leg.mode === "car" ? "5 10" : undefined}>
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

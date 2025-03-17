import './App.css';
import {MapContainer, TileLayer, Polyline, Popup} from 'react-leaflet';
import {Drawer, Box} from "@mui/material";
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
import useIsMobile from './hooks/useIsMobile';
import {useState} from "react";

function App() {
    const { outboundTrips, returnTrips } = useAppSelector((state) => state.trip.tripResults)
    const { outboundDecodedRoutes, returnDecodedRoutes } = useAppSelector((state) => state.trip.routes)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)
    const showCollapse = selectedTrip !== -1

    const [tabValue, setTabValue] = useState('outbound');

    const routesToShow = tabValue === 'outbound' ? outboundDecodedRoutes : returnDecodedRoutes;
    const tripsToShow = tabValue === 'outbound' ? outboundTrips : returnTrips;

    const isMobile = useIsMobile()

    // Route colors based on the current means of transport
    const routeColors: Record<TransportMode, string> = {
        foot: '#009eda',
        car: '#FF0000',
        tram: '#A05A2C',
        bus: '#00E68C',
        rail: '#800000',
        trolleybus: '#008033',
    }

    /**
     * Change the drawer height based on if it is minimized or not
     * @param minimize If the drawer is minimized
     */
    const changeHeight = (minimize: boolean) => {
        if (minimize) {
            document.getElementById('summary').style.maxHeight = '5vh'
        }
        else {
            document.getElementById('summary').style.maxHeight = '60vh'
        }
    }

    const handleSwitchRoutes = (tabValue: string) => {
        setTabValue(tabValue)
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

                { isMobile ? (outboundTrips.length === 0 &&
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

                { isMobile ? (outboundTrips.length > 0 &&
                    <Drawer sx={{ pointerEvents: 'none' }} PaperProps={{sx: { boxShadow: '0px -20px 10px rgba(0, 0, 0, 0.2)' }}} open={true} anchor='bottom' hideBackdrop>
                        <Box id="summary" sx={{
                            fontSize: '1em',
                            maxHeight: '50vh',
                            pointerEvents: 'auto',
                            display:'flex',
                            flexDirection: 'column',
                        }}>
                            <TripsSummary switchRoutes={handleSwitchRoutes} changeHeight={changeHeight}/>
                        </Box>
                    </Drawer>)
                    :
                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            fontSize: '1em',
                            maxHeight: '40vh',
                            pointerEvents: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            width: showCollapse ? '100%' : '50%',
                            padding: '0',
                        }}>
                        <div style={{ display: 'flex', flexDirection: 'row', pointerEvents: 'auto', overflow: 'auto' }}>
                            <TripsSummary switchRoutes={handleSwitchRoutes}/>
                        </div>
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

                {tripsToShow.length > 0 && selectedTrip !== -1 && routesToShow[selectedTrip].map((leg, i) => {
                    return (
                            <Polyline key={i} positions={leg.route}
                                pathOptions={{color: routeColors[leg.mode], weight: 5, opacity: 0.8}} dashArray={leg.mode === "car" ? "5 10" : "0 0"}>
                                <Popup closeOnClick={true}>
                                    <TripDetailLeg leg={tripsToShow[selectedTrip].legs[i]} idx={i} totalLegs={tripsToShow[selectedTrip].legs.length}/>
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

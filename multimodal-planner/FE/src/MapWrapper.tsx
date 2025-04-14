/**
 * @file MapWrapper.tsx
 * @brief Component that shows the map and all geographical primitives (points, lines, ...)
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import {MapContainer, Polyline, Popup, TileLayer} from "react-leaflet";
import PositionSelection from "./components/PositionSelection.tsx";
import TransferStopsSelection from "./components/TransferStopsSelection.tsx";
import TripDetailLeg from "./components/TripDetail/TripDetailLeg.tsx";
import {useAppSelector} from "./store/hooks.ts";
import 'leaflet/dist/leaflet.css'
import type { TransportMode } from "../../types/TransportMode.ts";

interface MapWrapperProps {
    tabValue: string;
}

function MapWrapper( {tabValue }: MapWrapperProps ) {
    const { outboundTrips, returnTrips } = useAppSelector((state) => state.trip.tripResults)
    const { outboundDecodedRoutes, returnDecodedRoutes } = useAppSelector((state) => state.trip.routes)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)

    const routesToShow = tabValue === 'outbound' ? outboundDecodedRoutes : returnDecodedRoutes;
    const tripsToShow = tabValue === 'outbound' ? outboundTrips : returnTrips;

    // Route colors based on the current means of transport
    const routeColors: Record<TransportMode, string> = {
        foot: '#009eda',
        car: '#FF0000',
        tram: '#A05A2C',
        bus: '#00E68C',
        rail: '#800000',
        trolleybus: '#008033',
        metro: '#000080'
    }

    return (
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
    )
}

export default MapWrapper;
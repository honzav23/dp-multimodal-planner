/**
 * @file MapWrapper.tsx
 * @brief Component that shows the map and all geographical primitives (points, lines, ...)
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {MapContainer, Polygon, Polyline, Popup, TileLayer} from "react-leaflet";
import PositionSelection from "./PositionSelection.tsx";
import TransferStopsSelection from "./TransferStopsSelection.tsx";
import TripDetailLeg from "./TripDetail/TripDetailLeg.tsx";
import {useAppSelector} from "../store/hooks.ts";
import 'leaflet/dist/leaflet.css'
import { routeColors } from "../common/common.ts";
import useIsMobile from '../hooks/useIsMobile.ts'
import ParkingLotInfo from "./ParkingLotInfo.tsx";
import {ParkingLot} from "../../../types/ParkingLot.ts";

interface MapWrapperProps {
    tabValue: string;
}

function MapWrapper( {tabValue }: MapWrapperProps ) {
    const { outboundTrips, returnTrips } = useAppSelector((state) => state.trip.tripResults)
    const { outboundDecodedRoutes, returnDecodedRoutes } = useAppSelector((state) => state.trip.routes)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)

    const parkingLots = useAppSelector((state) => state.transferStop.parkingLots)

    const routesToShow = tabValue === 'outbound' ? outboundDecodedRoutes : returnDecodedRoutes;
    const tripsToShow = tabValue === 'outbound' ? outboundTrips : returnTrips;
    const isMobile = useIsMobile()

    const parkingLotTagsDefined = (parkingLot: ParkingLot): boolean => {
        return Object.keys(parkingLot).length > 1
    }

    return (
        <MapContainer key={isMobile ? 'mobile' : 'desktop'} zoomControl={!isMobile} center={[49.195061, 16.606836]} zoom={12} scrollWheelZoom={true} style={{height: '100vh'}}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PositionSelection/>
            <TransferStopsSelection/>

            {/* Show the trip routes */}
            {tripsToShow.length > 0 && selectedTrip !== -1 && routesToShow[selectedTrip].map((leg, i) => {
                return (
                    <Polyline key={leg.route[0][0]} positions={leg.route}
                              pathOptions={{color: routeColors[leg.mode], weight: 5, opacity: 0.8}} dashArray={leg.mode === "car" ? "5 10" : "0 0"}>
                        <Popup closeOnClick={true}>
                            <TripDetailLeg leg={tripsToShow[selectedTrip].legs[i]} idx={i} totalLegs={tripsToShow[selectedTrip].legs.length}/>
                        </Popup>
                    </Polyline>
                )
            })}

            { parkingLots.map((p) => {
                return (
                    // TODO Add key to loop
                    <Polygon positions={p.polygon}>
                        { parkingLotTagsDefined(p) && (
                            <Popup closeOnClick={true}>
                                <ParkingLotInfo parkingLot={p}/>
                            </Popup>
                        ) }
                    </Polygon>
                )
            })}

        </MapContainer>
    )
}

export default MapWrapper;
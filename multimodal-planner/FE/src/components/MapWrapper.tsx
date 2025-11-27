/**
 * @file MapWrapper.tsx
 * @brief Component that shows the map and all geographical primitives (points, lines, ...)
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {
    MapContainer,
    Polygon,
    Polyline,
    Popup,
    TileLayer,
} from "react-leaflet";
import PositionSelection from "./PositionSelection.tsx";
import TransferStopsSelection from "./TransferStopsSelection.tsx";
import TripDetailLeg from "./TripDetail/TripDetailLeg.tsx";
import { useAppSelector } from "../store/hooks.ts";
import "leaflet/dist/leaflet.css";
import { routeColors } from "../common/common.ts";
import useIsMobile from "../hooks/useIsMobile.ts";
import ParkingLotInfo from "./ParkingLotInfo.tsx";
import WazeEventsVisualizer from "./Waze/WazeEventsVisualizer.tsx";
import { TransportMode } from "../../../types/TransportMode.ts";

function MapWrapper() {
    const { outboundTrips, returnTrips } = useAppSelector(
        (state) => state.trip.tripResults
    );
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip);
    const showOutboundTrips = useAppSelector(
        (state) => state.trip.showOutboundTrips
    );

    const parkingLots = useAppSelector((state) => state.parkingLot.parkingLots);

    const tripsToShow = showOutboundTrips ? outboundTrips : returnTrips;
    const isMobile = useIsMobile();

    return (
        <MapContainer
            key={isMobile ? "mobile" : "desktop"}
            zoomControl={!isMobile}
            center={[49.195061, 16.606836]}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: "100vh" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PositionSelection />
            <TransferStopsSelection />

            {/* Show the trip routes */}
            {tripsToShow.length > 0 &&
                selectedTrip !== null &&
                selectedTrip.legs.map((leg, i) => {
                    return (
                        <Polyline
                            key={leg.route[0][0]}
                            positions={leg.route}
                            pathOptions={{
                                color: routeColors[
                                    leg.modeOfTransport as TransportMode
                                ],
                                weight: 5,
                                opacity: 0.8,
                            }}
                            dashArray={
                                leg.modeOfTransport === "car" ? "5 10" : "0 0"
                            }
                        >
                            <Popup maxWidth={1000} closeOnClick={true}>
                                <TripDetailLeg
                                    leg={leg}
                                    idx={i}
                                    totalLegs={selectedTrip.legs.length}
                                />
                            </Popup>
                        </Polyline>
                    );
                })}

            {/* Show parking lots when requested */}
            {parkingLots.map((p) => {
                return (
                    <Polygon
                        key={(p.polygon[0][0] + p.polygon[0][1]).toString()}
                        positions={p.polygon}
                    >
                        <Popup maxWidth={1000} closeOnClick={true}>
                            <ParkingLotInfo parkingLot={p} />
                        </Popup>
                    </Polygon>
                );
            })}

            {selectedTrip && (
                <WazeEventsVisualizer events={selectedTrip.wazeEvents} />
            )}
        </MapContainer>
    );
}

export default MapWrapper;

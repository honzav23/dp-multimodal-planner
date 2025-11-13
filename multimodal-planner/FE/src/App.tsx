/**
 * @file App.tsx
 * @brief Main component of the application, contains all of the subcomponents either
 * in desktop or mobile view
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import TripRequestForm from "./components/Form/TripRequestForm.tsx";
import TripsSummary from "./components/TripsSummary";
import { useAppSelector } from "./store/hooks";
import ActionFeedback from "./components/ActionFeedback";
import "../i18n.ts";
import useIsMobile from "./hooks/useIsMobile";
import { useEffect } from "react";
import MobileTripRequestForm from "./components/MobileViews/MobileTripRequestForm.tsx";
import MobileTripsSummary from "./components/MobileViews/MobileTripSummary";
import MapWrapper from "./components/MapWrapper.tsx";
import Sidebar from "./components/Sidebar.tsx";

function App() {
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip);
    const outboundTripsLength = useAppSelector(
        (state) => state.trip.tripResults.outboundTrips.length
    );
    const { startInputFocused, endInputFocused } = useAppSelector(
        (state) => state.focus
    );
    const showCollapse = selectedTrip !== null;
    const isMobile = useIsMobile();

    useEffect(() => {
        // Minimize the request form in mobile view when selecting a point
        if (isMobile) {
            if (startInputFocused || endInputFocused) {
                minimize("form");
            } else {
                if (document.getElementById("form")) {
                    maximize("form");
                }
            }
        }
    }, [startInputFocused, endInputFocused, isMobile]);

    /**
     * Minimize the content
     * @param origin Element id to minimize
     */
    const minimize = (origin: string) => {
        document.getElementById(origin)!.style.maxHeight = "5vh";
    };

    /**
     * Maximize the content
     * @param origin Element id to maximize
     */
    const maximize = (origin: string) => {
        document.getElementById(origin)!.style.maxHeight = "60vh";
    };

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <div
                style={{
                    height: "90vh",
                    minWidth: isMobile ? "auto" : "700px", // 700 px is approximately 36 % of full hd width
                    width: "36%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "absolute",
                    top: "5%",
                    left: "5%",
                    pointerEvents: "none",
                    zIndex: 1000,
                }}
            >
                {/* Mobile view for the request form */}
                {isMobile ? (
                    <MobileTripRequestForm />
                ) : (
                    <div
                        style={{
                            padding: "10px 10px",
                            pointerEvents: "auto",
                            width: "50%",
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                        }}
                    >
                        <TripRequestForm />
                    </div>
                )}

                {/* Mobile view for the trips summary */}
                {outboundTripsLength > 0 &&
                    (isMobile ? (
                        <MobileTripsSummary />
                    ) : (
                        <div
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                fontSize: "1em",
                                maxHeight: "40vh",
                                pointerEvents: "auto",
                                display: "flex",
                                flexDirection: "column",
                                width: showCollapse ? "100%" : "50%",
                                padding: "0",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    pointerEvents: "auto",
                                    overflow: "auto",
                                }}
                            >
                                <TripsSummary />
                            </div>
                        </div>
                    ))}
            </div>
            <Sidebar />
            <MapWrapper />
            <ActionFeedback />
        </div>
    );
}

export default App;

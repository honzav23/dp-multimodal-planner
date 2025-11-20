import { Box, Divider, Drawer, IconButton } from "@mui/material";
import TripsSummary from "../TripsSummary.tsx";
import { useAppSelector, useAppDispatch } from "../../store/hooks.ts";
import {
    setSelectedTrip,
    setShowTripsSummary,
} from "../../store/slices/tripSlice.ts";
import { useState } from "react";
import { ArrowBack, Minimize, ZoomOutMap } from "@mui/icons-material";
import ControlPanel from "./ControlPanel";

function MobileTripSummary() {
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip);
    const showTripsSummary = useAppSelector(
        (state) => state.trip.showTripsSummary
    );
    const dispatch = useAppDispatch();

    const maximizeHeight = "50vh";
    const minimizeHeight = "36px";

    const [drawerMaxHeight, setDrawerMaxHeight] = useState(maximizeHeight);

    const minimize = () => {
        setDrawerMaxHeight(minimizeHeight);
    };

    const maximize = () => {
        setDrawerMaxHeight(maximizeHeight);
    };

    const backToTrips = () => {
        setDrawerMaxHeight(maximizeHeight);

        // Go from trip detail to trip summary
        if (selectedTrip !== null) {
            dispatch(setSelectedTrip(null));
        }

        // Go from trip summary to trip planning
        else {
            dispatch(setShowTripsSummary(false));
        }
    };

    return (
        showTripsSummary && (
            <Drawer
                sx={{ pointerEvents: "none" }}
                slotProps={{
                    paper: {
                        sx: {
                            overflow: "hidden",
                            boxShadow: "0px -20px 10px rgba(0, 0, 0, 0.2)",
                        },
                    },
                }}
                open={true}
                anchor="bottom"
                hideBackdrop
            >
                <Box
                    sx={{
                        fontSize: "1em",
                        maxHeight: drawerMaxHeight,
                        pointerEvents: "auto",
                        display: "flex",
                        flexDirection: "column",
                        transition: "max-height 0.2s ease-in-out",
                    }}
                >
                    <ControlPanel
                        drawerMaxHeight={drawerMaxHeight}
                        minimizeHeight={minimizeHeight}
                        minimizeButtonClicked={minimize}
                        maximizeButtonClicked={maximize}
                        backButtonClicked={backToTrips}
                    />
                    <Divider />
                    <TripsSummary />
                </Box>
            </Drawer>
        )
    );
}

export default MobileTripSummary;

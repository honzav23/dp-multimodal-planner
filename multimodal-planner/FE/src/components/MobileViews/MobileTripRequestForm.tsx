import { Box, Drawer } from "@mui/material";
import TripRequestForm from "../Form/TripRequestForm.tsx";
import { useAppSelector } from "../../store/hooks.ts";
import { useState, useEffect } from "react";

function MobileTripRequestForm() {
    const showTripsSummary = useAppSelector((state) => state.trip.showTripsSummary)
    const startInputFocused = useAppSelector((state) => state.focus.startInputFocused)
    const endInputFocused = useAppSelector((state) => state.focus.endInputFocused)

    const maximizeHeight = "60vh";
    const minimizeHeight = "36px";

    const [drawerMaxHeight, setDrawerMaxHeight] = useState(maximizeHeight);

    const minimize = () => {
        setDrawerMaxHeight(minimizeHeight);
    };

    const maximize = () => {
        setDrawerMaxHeight(maximizeHeight);
    };

    // Minimize the request form when choosing from the map and maximize when not choosing
    useEffect(() => {
        if (startInputFocused || endInputFocused) {
            setDrawerMaxHeight(minimizeHeight);
        }
        else {
            setDrawerMaxHeight(maximizeHeight);
        }
    }, [startInputFocused, endInputFocused]);

    return (
        !showTripsSummary && (
            <Drawer
                sx={{ pointerEvents: "none" }}
                open={true}
                anchor="bottom"
                slotProps={{
                    paper: {
                        sx: {
                            overflow: "hidden",
                            boxShadow: "0px -20px 10px rgba(0, 0, 0, 0.2)",
                        },
                    },
                }}
                hideBackdrop
            >
                <Box
                    id="form"
                    sx={{
                        pointerEvents: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        m: 1,
                        maxHeight: drawerMaxHeight,
                        transition: "max-height 0.2s ease-in-out",
                    }}
                >
                    <TripRequestForm minimize={minimize} maximize={maximize} />
                </Box>
            </Drawer>
        )
    );
}

export default MobileTripRequestForm;

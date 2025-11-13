import { Box, Drawer } from "@mui/material";
import TripRequestForm from "../Form/TripRequestForm.tsx";
import { useAppSelector } from "../../store/hooks.ts";
import { useState } from "react";

function MobileTripRequestForm() {
    const outboundTrips = useAppSelector(
        (state) => state.trip.tripResults.outboundTrips
    );

    const maximizeHeight = "60vh";
    const minimizeHeight = "5vh";

    const [drawerMaxHeight, setDrawerMaxHeight] = useState(maximizeHeight);

    const minimize = () => {
        setDrawerMaxHeight(minimizeHeight);
    };

    const maximize = () => {
        setDrawerMaxHeight(maximizeHeight);
    };

    return (
        outboundTrips.length === 0 && (
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

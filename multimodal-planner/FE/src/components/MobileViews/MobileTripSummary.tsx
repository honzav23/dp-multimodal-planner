import {Box, Drawer} from "@mui/material";
import TripsSummary from "../TripsSummary.tsx";
import { useAppSelector } from "../../store/hooks.ts";
import {useState} from "react";

function MobileTripSummary() {
    const outboundTrips = useAppSelector((state) => state.trip.tripResults.outboundTrips);

    const maximizeHeight = '60vh'
    const minimizeHeight = '5vh'

    const [drawerMaxHeight, setDrawerMaxHeight] = useState('50vh');

    const minimize = () => {
        setDrawerMaxHeight(minimizeHeight);
    }

    const maximize = () => {
        setDrawerMaxHeight(maximizeHeight);
    }

    return (
        outboundTrips.length > 0 &&
            <Drawer sx={{ pointerEvents: 'none' }} PaperProps={{sx: {overflow: 'hidden', boxShadow: '0px -20px 10px rgba(0, 0, 0, 0.2)' }}} open={true} anchor='bottom' hideBackdrop>
                <Box id="summary" sx={{
                    fontSize: '1em',
                        maxHeight: drawerMaxHeight,
                        pointerEvents: 'auto',
                        display:'flex',
                        flexDirection: 'column',
                }}>
                    <TripsSummary minimize={minimize} maximize={maximize}/>
                </Box>
            </Drawer>
    )
}

export default MobileTripSummary;
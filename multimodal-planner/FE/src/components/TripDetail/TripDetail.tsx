import { List } from '@mui/material'
import type {TripResult} from "../../../../types/TripResult";
import TripDetailLeg from './TripDetailLeg';
import { isMobile } from "react-device-detect";

interface TripDetailProps {
    trip: TripResult | null
}
function TripDetail({ trip }: TripDetailProps) {

    if (trip === null) {
        return <></>
    }

    return (
        <div
            style={{
                overflow: isMobile ? 'hidden' : "auto",
                scrollbarWidth: 'thin',
                gap: "5px",
            }}>
            <List
                component="div"
                sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: '10px',
                    color: "#37474F"
                }}
            >
                {trip.legs.map((leg, idx) => (
                    <TripDetailLeg key={leg.startTime} leg={leg} idx={idx} totalLegs={trip.legs.length}/>
                ))}
            </List>
        </div>
    )
}

export default TripDetail;
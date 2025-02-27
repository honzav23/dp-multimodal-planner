import { List } from '@mui/material'
import type {TripResult} from "../../../../types/TripResult";
import TripDetailLeg from './TripDetailLeg';

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
                overflow: "auto",
                scrollbarWidth: 'thin',
                gap: "5px",
                maxHeight: '45vh'
            }}
        >
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
                    <TripDetailLeg leg={leg} idx={idx} totalLegs={trip.legs.length}/>
                ))}
            </List>
        </div>
    )
}

export default TripDetail;
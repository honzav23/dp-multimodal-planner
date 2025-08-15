/**
 * @file TripDetail.tsx
 * @brief Component for showing the trip legs
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { List } from '@mui/material'
import type { TripResultWithIdConvertedRoute } from "../../../../types/TripResult";
import TripDetailLeg from './TripDetailLeg';
import useIsMobile from '../../hooks/useIsMobile';

interface TripDetailProps {
    trip: TripResultWithIdConvertedRoute | null
}
function TripDetail({ trip }: TripDetailProps) {
    const isMobile = useIsMobile()

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
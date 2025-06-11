/**
 * @file ParkingLotInfo.tsx
 * @brief Component that shows all the information about a certain parking lot
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */
import {ParkingLot, ParkingLotKeys} from "../../../types/ParkingLot.ts";
import {Box} from "@mui/material";
import { useTranslation } from "react-i18next";

interface ParkingLotInfoProps {
    parkingLot: ParkingLot
}

function ParkingLotInfo({ parkingLot }: ParkingLotInfoProps) {
    const { t } = useTranslation();
    const parkingLotKeys = Object.keys(parkingLot).filter(key => key !== 'polygon');

    return (
        <Box sx={{ padding: '0 10px' }}>
            <table
                style={{
                    borderCollapse: "collapse",
                    borderTop: "1px solid #ddd",
                    margin: "20px auto",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                <tbody>
                    {parkingLotKeys.map((key, i) => {
                        return (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#ffffff'}}>
                                <th style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{t(`parkingLots.${key}`)}:</th>
                                <td style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{parkingLot[key as ParkingLotKeys]}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </Box>
    )
}

export default ParkingLotInfo;
/**
 * @file LegDelayTable.tsx
 * @brief Component for showing the table of delays for the past dates
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {Box} from "@mui/material";
import {DelayInfo} from "../../../../types/TripResult.ts";
import { useTranslation } from "react-i18next";

interface LegDelayTableProps {
    delays: DelayInfo[]
}

function LegDelayTable({ delays }: LegDelayTableProps) {
    const { t } = useTranslation() 

    /**
     * Convert date to locale string
     * @param d Date in format YY-MM-DD
     * @returns 
     */
    const toLocaleDate = (d: string): string => {
        const date = new Date(d)
        return `${date.toLocaleDateString()}`
    }

    return (
        <Box sx={{ padding: '0 10px' }}>
            <table
                style={{
                    borderCollapse: "collapse",
                    margin: "20px auto",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
            >
                <thead>
                <tr style={{ backgroundColor: "#4CAF50", color: "white" }}>
                    <th
                        style={{
                            padding: "12px 15px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                        }}
                    >
                        {t('date')}
                    </th>
                    <th
                        style={{
                            padding: "12px 15px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                        }}
                    >
                        {t('delay')}
                    </th>
                </tr>
                </thead>
                <tbody>
                { delays.map((delay, idx) => (
                    <tr key={delay.delayDate} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                        <td style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{ toLocaleDate(delay.delayDate) }</td>
                        <td style={{ padding: "12px 15px", border: "1px solid #ddd" }}><strong>{ delay.delay } min</strong></td>
                    </tr>
                )) }
                </tbody>
            </table>
        </Box>
    )
}

export default LegDelayTable;
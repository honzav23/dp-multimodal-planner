import {Box} from "@mui/material";
import {DelayInfo} from "../../../types/TripResult.ts";

interface LegDelayTableProps {
    delays: DelayInfo[]
}

function LegDelayTable({ delays }: LegDelayTableProps) {

    const sortedDelays = delays.sort((a: DelayInfo, b: DelayInfo) => a.delayDate - b.delayDate);

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
                        Datum
                    </th>
                    <th
                        style={{
                            padding: "12px 15px",
                            border: "1px solid #ddd",
                            textAlign: "left",
                        }}
                    >
                        Zpoždění
                    </th>
                </tr>
                </thead>
                <tbody>
                { delays.map((delay, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                        <td style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{ delay.delayDate }</td>
                        <td style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{ delay.delay } min</td>
                    </tr>
                )) }
                </tbody>
            </table>
        </Box>
    )
}

export default LegDelayTable;
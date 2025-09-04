import { type WazeAlert } from "../../../../types/WazeEvents.ts";
import {Marker, Popup} from "react-leaflet";
import {Box} from "@mui/material";
import styles from "../../css/styles.module.css";
import { useTranslation } from "react-i18next";
import { warningSignIcon, trafficJamSignIcon } from "../../img/wazeDivIcons.ts";
import warningSignSvg from "../../img/warningSign.svg"

interface WazeAlertProps {
    alerts: WazeAlert[];
}

function WazeAlerts({ alerts }: WazeAlertProps) {
    const keysForVisualization = ['city', 'street', 'pubMillis', 'type', 'subtype'] as const
    const { t } = useTranslation();


    const formatValue = (alert: WazeAlert, key: typeof keysForVisualization[number]): string => {
        switch (key) {
            case 'type':
                return t(`waze.types.${alert[key].toLowerCase()}`)
            case 'subtype':
                if (alert[key] === '') {
                    return ''
                }
                return t(`waze.subtypes.${alert[key].toLowerCase()}`)
            case 'pubMillis':
                const date = new Date(alert[key]);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            default:
                if (alert[key] === null) {
                    return '';
                }
                return alert[key]
        }
    }

    return (
        <>
            { alerts.map((alert) =>
                <Marker key={alert.uuid} position={[alert.location.y, alert.location.x]} icon={alert.type === 'JAM' ? trafficJamSignIcon : warningSignIcon}>
                    <Popup closeOnClick maxWidth={1000}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <img style={{ width: '60px', height: '50px' }} alt='' src={warningSignSvg}/>
                        </div>
                        <Box sx={{ padding: '0 10px' }}>
                            <table className={styles.tableStyle}>
                                <tbody>
                                { keysForVisualization.map(key =>
                                    <tr className={styles.tableRow} key={key}>
                                        <th className={styles.tableContent}>{t(`waze.${key}`)}:</th>
                                        <td className={styles.tableContent}>{formatValue(alert, key)}</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </Box>
                    </Popup>
                </Marker>
            )}
        </>
    )
}

export default WazeAlerts;
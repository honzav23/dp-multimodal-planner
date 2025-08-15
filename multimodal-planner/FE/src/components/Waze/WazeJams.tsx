import { type WazeJam } from "../../../../types/WazeEvents.ts";
import {Marker, Polyline, Popup} from "react-leaflet";
import { useTranslation } from "react-i18next";
import styles from '../../css/styles.module.css'
import { closedRoadSignIcon, trafficJamSignIcon } from "../../img/wazeDivIcons.ts";

interface WazeJamsProps {
    jams: WazeJam[]
}

function WazeJams({ jams }: WazeJamsProps) {
    const keysForVisualization = ['city', 'street', 'pubMillis', 'delay', 'length', 'speedKMH'] as const;
    const { t } = useTranslation();

    const convertObjectCoordsToArrayCoords = (coords: WazeJam['line']): [number, number][] => {
        return coords.map(c => [c.y, c.x]);
    }

    const formatValue = (jam: WazeJam, key: typeof keysForVisualization[number]): string => {
        switch (key) {
            case 'pubMillis':
                const date = new Date(jam[key]);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            case 'delay':
                return `${Math.floor(jam[key] / 60)} min`;
            case 'length':
                return `${jam[key]} m`
            case 'speedKMH':
                return `${jam[key]} km/h`;
            default:
                return jam[key];
        }
    }

    const getApproximateLineCenter = (jam: WazeJam): [number, number] => {
        if (jam.line.length === 2) {
            const newX = (jam.line[0].x + jam.line[1].x) / 2
            const newY = (jam.line[0].y + jam.line[1].y) / 2
            return [newY, newX]
        }

        const centerLinePoint = jam.line[Math.floor(jam.line.length / 2)];
        return [centerLinePoint.y, centerLinePoint.x];
    }

    return (jams.map((jam) =>
            <div key={jam.uuid}>
                <Polyline stroke positions={convertObjectCoordsToArrayCoords(jam.line)} pathOptions={{ color: 'black', weight: 5 }}>
                    <Popup closeOnClick>
                        { jam.roadClosed ?
                            <h3 style={{ textAlign: 'center' }}>{t('waze.types.road_closed')}</h3>
                            :
                            <>
                                <h3 style={{ textAlign: 'center' }}>{t('waze.types.jam')}</h3>
                                <table className={styles.tableStyle}>
                                    <tbody>
                                        { keysForVisualization.map(key =>
                                            <tr className={styles.tableRow} key={key}>
                                                <th className={styles.tableContent}>{t(`waze.${key}`)}:</th>
                                                <td className={styles.tableContent}>{formatValue(jam, key)}</td>
                                            </tr>
                                        )}

                                    </tbody>
                                </table>
                            </>
                        }
                    </Popup>
                </Polyline>
                <Marker key={jam.uuid + 'key'} position={getApproximateLineCenter(jam)} icon={jam.roadClosed ? closedRoadSignIcon : trafficJamSignIcon}/>
            </div>
        )
    )
}

export default WazeJams;
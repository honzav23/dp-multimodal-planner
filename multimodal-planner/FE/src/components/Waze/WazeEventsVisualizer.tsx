import { type WazeEvents } from "../../../../types/WazeEvents.ts";
import WazeJams from "./WazeJams";
import WazeAlerts from './WazeAlerts'

interface WazeEventsVisualizerProps {
    events: WazeEvents
}

function WazeEventsVisualizer({ events }: WazeEventsVisualizerProps) {

    return (
       <>
           { events.alerts.length > 0 && <WazeAlerts alerts={events.alerts}/> }
           { events.jams.length > 0 && <WazeJams jams={events.jams}/> }
       </>
   )
}

export default WazeEventsVisualizer;
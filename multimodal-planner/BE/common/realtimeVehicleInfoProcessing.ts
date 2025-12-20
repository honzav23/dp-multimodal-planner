import { RealtimeVehicleInfo } from "../types/RealtimeVehicleInfo.ts";
import { kordisLogger } from "../logger.ts";

const EXTERNAL_WS_SERVER_URL = 'wss://gis.brno.cz/geoevent/ws/services/ODAE_public_transit_stream_service/StreamServer/subscribe';

export class KordisWebSocketManager {
    private static instance: KordisWebSocketManager;
    private wsUrl: WebSocket | null;
    private conversionTable: Record<string, number[]>;
    private tripIdToVehicleInfo: Record<string, RealtimeVehicleInfo>;

    constructor() {
        this.wsUrl = null
        this.conversionTable = {}
        this.tripIdToVehicleInfo = {}
    }

    public static getInstance(): KordisWebSocketManager {
        if (!KordisWebSocketManager.instance) {
            KordisWebSocketManager.instance = new KordisWebSocketManager();
        }
        return KordisWebSocketManager.instance;
    }

    public getTripIdToVehicleInfo() {
        return this.tripIdToVehicleInfo
    }

    public connectToKordisWebSocket() {
        if (this.wsUrl && (this.wsUrl.readyState === WebSocket.OPEN || this.wsUrl.readyState === WebSocket.CONNECTING)) {
            return;
        }
        this.wsUrl = new WebSocket(EXTERNAL_WS_SERVER_URL);

        this.wsUrl.onopen = () => {
            kordisLogger.info("Connected to KORDIS WebSocket");
        }

        this.wsUrl.onmessage = (event) => this.processRealtimeVehicleInfo(event)

        this.wsUrl.onclose = () => {
            this.wsUrl = null;
            setTimeout(() => this.connectToKordisWebSocket(), 5000);
        };

        this.wsUrl.onerror = (event) => {
            kordisLogger.error("Could not connect to Kordis WebSocket. Trying again...");
        };
    }

    public async createConversionTable() {
        const apiContent = await Deno.readTextFile('./scripts/GTFS/api.txt');
        const apiLinesTrimmed = apiContent.split('\n').map(line => line.trim());

        // Matches the format "lineid/routeid = tripId"
        const regex = /((\d+\/\d+)\s*=\s*(\d+))/;
        for (const line of apiLinesTrimmed) {
            const match = line.match(regex);
            if (!match) {
                continue
            }
            const lineIdRouteId = match[2];
            const tripId = match[3];
            if (tripId && lineIdRouteId) {
                const tripIdNumber = parseInt(tripId);
                if (isNaN(tripIdNumber)) {
                    continue;
                }
                if (this.conversionTable[lineIdRouteId] === undefined) {
                    this.conversionTable[lineIdRouteId] = [tripIdNumber];
                }
                else {
                    this.conversionTable[lineIdRouteId].push(tripIdNumber)
                }
            }
        }
    }

    /**
     * Processes the real-time vehicle information received from the WebSocket.
     * It updates the global `tripIdToVehicleInfo` mapping with the latest vehicle data.
     * @param event The message event containing the real-time vehicle data.
     */
    private processRealtimeVehicleInfo(event: MessageEvent) {
        const realTimeVehicleData = JSON.parse(event.data) as RealtimeVehicleInfo
        const tripIdForVehicle = this.conversionTable[`${realTimeVehicleData.attributes.lineid}/${realTimeVehicleData.attributes.routeid}`];
        if (tripIdForVehicle) {
            for (const tripId of tripIdForVehicle) {
                this.tripIdToVehicleInfo[tripId] = realTimeVehicleData;
            }
        }
    }
}
export type TransferStop = {
    stopId: string;
    stopName: string;
    stopLat: number;
    stopLon: number;
    hasParking: string;
};

export type TransferStopWithDistance = TransferStop & { distanceFromOrigin: number };
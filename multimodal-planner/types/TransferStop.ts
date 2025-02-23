export type TransferStop = {
    stopId: string;
    stopName: string;
    stopCoords: [number, number];
    hasParking: boolean;
};

export type TransferStopCluster = TransferStop & { cluster: number, nearest: number };
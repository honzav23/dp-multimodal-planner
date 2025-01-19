export type TripRequest = {
    origin: [number, number];
    destination: [number, number];
    departureTime: Date;
    preferences?: {
        modeOfTransport: ['bus' | 'train' | 'tram' | 'trolleybus'];
        minimizeTransfers: boolean;
        avoidHighways?: boolean;
        preferScenicRoutes?: boolean;
    };
}
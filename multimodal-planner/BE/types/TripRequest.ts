export type TripRequest = {
    origin: [number, number];
    destination: [number, number];
    departureDate: string;
    preferences?: {
        modeOfTransport: ['bus' | 'train' | 'tram' | 'trolleybus'];
        minimizeTransfers: boolean;
        avoidHighways?: boolean;
        preferScenicRoutes?: boolean;
    };
}
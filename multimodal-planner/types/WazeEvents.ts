const wazeIncidents = {
    ACCIDENT: {
        ACCIDENT_MINOR: {},
        ACCIDENT_MAJOR: {},
        NO_SUBTYPE: {},
        '': {}
    },
    JAM: {
        JAM_LIGHT_TRAFFIC: {},
        JAM_MODERATE_TRAFFIC: {},
        JAM_HEAVY_TRAFFIC: {},
        JAM_STAND_STILL_TRAFFIC: {},
        NO_SUBTYPE: {},
    },
    HAZARD: {
        HAZARD_ON_ROAD: {},
        HAZARD_ON_SHOULDER: {},
        HAZARD_ON_ROAD_CAR_STOPPED: {},
        HAZARD_ON_ROAD_CONSTRUCTION: {},
        HAZARD_ON_ROAD_EMERGENCY_VEHICLE: {},
        HAZARD_ON_ROAD_ICE: {},
        HAZARD_ON_ROAD_LANE_CLOSED: {},
        HAZARD_ON_ROAD_OBJECT: {},
        HAZARD_ON_ROAD_OIL: {},
        HAZARD_ON_ROAD_POT_HOLE: {},
        HAZARD_ON_ROAD_ROAD_KILL: {},
        HAZARD_ON_ROAD_TRAFFIC_LIGHT_FAULT: {},
        HAZARD_ON_SHOULDER_ANIMALS: {},
        HAZARD_ON_SHOULDER_CAR_STOPPED: {},
        HAZARD_ON_SHOULDER_MISSING_SIGN: {},
        HAZARD_WEATHER: {},
        HAZARD_WEATHER_FLOOD: {},
        HAZARD_WEATHER_HAIL: {},
        HAZARD_WEATHER_HEAT_WAVE: {},
        HAZARD_WEATHER_HEAVY_RAIN: {},
        HAZARD_WEATHER_HEAVY_SNOW: {},
        HAZARD_WEATHER_HURRICANE: {},
        HAZARD_WEATHER_FOG: {},
        HAZARD_WEATHER_FREEZING_RAIN: {},
        HAZARD_WEATHER_MONSOON: {},
        HAZARD_WEATHER_SNOW_ICE: {},
        HAZARD_WEATHER_TORNADO: {},
        NO_SUBTYPE: {}

    },
    ROAD_CLOSED: {
        ROAD_CLOSED_HAZARD: {},
        ROAD_CLOSED_CONSTRUCTION: {},
        ROAD_CLOSED_EVENT: {},
        NO_SUBTYPE: {},
    },
    CONSTRUCTION: {
        NO_SUBTYPE: {},
    }
} as const;

type WazeIncident = {
    [K in keyof typeof wazeIncidents]: {
        type: K;
        subtype: keyof typeof wazeIncidents[K];
    };
}[keyof typeof wazeIncidents];

export type WazeAlert = {
    pubMillis: number,
    location: {
        x: number, // Longitude
        y: number // Latitude
    },
    uuid: string,
    magvar: number, // Should be between 0 - 359
    reportDescription: string,
    street: string | null,
    city: string,
    country: string,
    roadType: number,
    reportRating: 1 | 2 | 3 | 4 | 5 | 6,
    reliability: number,
    confidence: number,
    reportByMunicipalityUser: 'true' | 'false',
    nThumbsUp: number
} & WazeIncident

export type WazeJam = {
    pubMillis: number,
    uuid: number,
    id: number,
    type: string,
    line: { x: number; y: number }[],
    speed: number, // m/s
    speedKMH: number,
    length: number, // In meters
    delay: number // In seconds
    street: string,
    city: string,
    country: string,
    roadType: number,
    segments: {
        fromNode: number,
        toNode: number,
        ID: number,
    }[],
    level: 0 | 1 | 2 | 3 | 4 | 5,
    turnLine: { x: number; y: number },
    turnType: string,
    blockingAlertUuid?: string,
    roadClosed: boolean
}

export type WazeEvents = {
    alerts: WazeAlert[],
    endTimeMilis: number,
    startTimeMilis: number,
    startTime: string,
    endTime: string,
    jams: WazeJam[]
}
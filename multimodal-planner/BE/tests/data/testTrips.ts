import type {OTPTripPattern} from "../../types/OTPGraphQLData.ts";
import type { TripResult } from "../../../types/TripResult.ts";

export const carTrip1: OTPTripPattern = {
    aimedStartTime: "2025-07-21T10:00:00Z",
    aimedEndTime: "2025-07-21T10:30:00Z",
    distance: 25000,
    duration: 1800,
    legs: [
        {
            mode: "car",
            aimedStartTime: "2025-07-21T10:00:00Z",
            aimedEndTime: "2025-07-21T10:30:00Z",
            distance: 25000,
            serviceJourney: null,
            fromPlace: {
                name: "Home Address, Prague",
                quay: null
            },
            toPlace: {
                name: "Office Building, Prague",
                latitude: 50.08804,
                longitude: 14.42076,
                quay: null
            },
            line: null,
            pointsOnLink: { points: "sv~eI{`tGj@aFz@cDx@gCp@kBt@cDvB" }
        }
    ]

};

export const carTrip1CorrectResult: TripResult = {
    totalTime: carTrip1.duration,
    totalDistance: carTrip1.distance,
    startTime: carTrip1.aimedStartTime,
    endTime: carTrip1.aimedEndTime,
    totalTransfers: 0,
    totalEmissions: 0,
    via: '',
    lowestTime: false,
    lowestEmissions: false,
    legs: [
        {
            startTime: carTrip1.legs[0].aimedStartTime,
            endTime: carTrip1.legs[0].aimedEndTime,
            modeOfTransport: carTrip1.legs[0].mode,
            from: carTrip1.legs[0].fromPlace.name,
            to: carTrip1.legs[0].toPlace.name,
            distance: carTrip1.legs[0].distance,
            line: '',
            route: carTrip1.legs[0].pointsOnLink.points,
            delays: {
                averageDelay: 0,
                currentDelay: -1,
                pastDelays: []
            }
        }
    ]
}

export const publicTransportTrip1: OTPTripPattern = {
    aimedStartTime: "2025-07-21T15:55:00Z",
    aimedEndTime: "2025-07-21T16:40:00Z",
    distance: 35000,
    duration: 2700,
    legs: [
        {
            mode: "bus",
            aimedStartTime: "2025-07-21T15:55:00Z",
            aimedEndTime: "2025-07-21T16:20:00Z",
            distance: 20000,
            serviceJourney: {
                id: "bus_service_12345",
                quays: [
                    { name: "Rožnov p.Radh., aut.st.", id: "cz:76510:001" },
                    { name: "Valašské Meziříčí, aut.nádraží", id: "cz:75701:001" }
                ],
                passingTimes: [
                    { departure: { time: "2025-07-21T15:55:00Z" } },
                    { departure: { time: "2025-07-21T16:05:00Z" } },
                    { departure: { time: "2025-07-21T16:20:00Z" } }
                ]
            },
            fromPlace: {
                name: "Rožnov p.Radh., aut.st.",
                quay: { id: "cz:76510:001" }
            },
            toPlace: {
                name: "Valašské Meziříčí, aut.nádraží",
                latitude: 49.4754,
                longitude: 17.9892,
                quay: { id: "cz:75701:001" }
            },
            line: { publicCode: "941" },
            pointsOnLink: { points: "uvweI_r_lG~a@eBfXmArLw@`Hw@fEq@dC{@nCaAnCiA" }
        },
        {
            mode: "rail",
            aimedStartTime: "2025-07-21T16:25:00Z",
            aimedEndTime: "2025-07-21T16:40:00Z",
            distance: 15000, // meters
            serviceJourney: {
                id: "rail_service_67890",
                quays: [
                    { name: "Valašské Meziříčí, žel.st.", id: "cz:75701:002" },
                    { name: "Bystřice pod Hostýnem, žel.st.", id: "cz:76371:001" }
                ],
                passingTimes: [
                    { departure: { time: "2025-07-21T16:25:00Z" } },
                    { departure: { time: "2025-07-21T16:35:00Z" } },
                    { departure: { time: "2025-07-21T16:40:00Z" } }
                ]
            },
            fromPlace: {
                name: "Valašské Meziříčí, žel.st.",
                quay: { id: "cz:75701:002" }
            },
            toPlace: {
                name: "Bystřice pod Hostýnem, žel.st.",
                latitude: 49.3392,
                longitude: 17.5878,
                quay: { id: "cz:76371:001" }
            },
            line: { publicCode: "S5" },
            pointsOnLink: { points: "ujweIu|z_Fk@cBeAuBg@eAq@cAu@{Aq@uAw@yA" }
        }
    ]
};

export const publicTransportTrip1CorrectResult: TripResult = {
    totalTime: publicTransportTrip1.duration,
    totalDistance: publicTransportTrip1.distance,
    startTime: publicTransportTrip1.aimedStartTime,
    endTime: publicTransportTrip1.aimedEndTime,
    totalTransfers: 1,
    totalEmissions: 0,
    via: '',
    lowestTime: false,
    lowestEmissions: false,
    legs: [
        {
            startTime: publicTransportTrip1.legs[0].aimedStartTime,
            endTime: publicTransportTrip1.legs[0].aimedEndTime,
            modeOfTransport: publicTransportTrip1.legs[0].mode,
            from: publicTransportTrip1.legs[0].fromPlace.name,
            to: publicTransportTrip1.legs[0].toPlace.name,
            distance: publicTransportTrip1.legs[0].distance,
            line: publicTransportTrip1.legs[0].line!.publicCode,
            route: publicTransportTrip1.legs[0].pointsOnLink.points,
            delays: {
                averageDelay: 0,
                currentDelay: -1,
                pastDelays: []
            }

        },
        {
            startTime: publicTransportTrip1.legs[1].aimedStartTime,
            endTime: publicTransportTrip1.legs[1].aimedEndTime,
            modeOfTransport: publicTransportTrip1.legs[1].mode,
            from: publicTransportTrip1.legs[1].fromPlace.name,
            to: publicTransportTrip1.legs[1].toPlace.name,
            distance: publicTransportTrip1.legs[1].distance,
            line: publicTransportTrip1.legs[1].line!.publicCode,
            route: publicTransportTrip1.legs[1].pointsOnLink.points,
            delays: {
                averageDelay: 0,
                currentDelay: -1,
                pastDelays: []
            }
        }
    ]
}

export const publicTransportTrip1CorrectResultWithDelay: TripResult = {
    ...publicTransportTrip1CorrectResult, legs: [{...publicTransportTrip1CorrectResult.legs[0], delays: {averageDelay: 0, currentDelay: 15, pastDelays: []}},
        publicTransportTrip1CorrectResult.legs[1]]
}

export const publicTransportTripWithWalkNoDelay: TripResult = {
    totalTime: 40 * 60,
    totalDistance: 15.7,
    startTime: "2025-07-23T08:00:00Z",
    endTime: "2025-07-23T08:40:00Z",
    legs: [
        {
            startTime: "2025-07-23T08:00:00Z",
            endTime: "2025-07-23T08:12:00Z",
            modeOfTransport: "bus",
            from: "Rožnov p.Radh., aut.st.",
            to: "Zubří, kulturní dům",
            distance: 5, //
            line: "942",
            route: "uvweI_r_lG~a@eBfXmArLw@`Hw@fEq@dC{@nCaAnCiA",
            delays: {
                averageDelay: 1,
                currentDelay: 0,
                pastDelays: []
            }
        },
        {
            startTime: "2025-07-23T08:12:00Z",
            endTime: "2025-07-23T08:20:00Z",
            modeOfTransport: "foot",
            from: "Zubří, kulturní dům",
            to: "Střítež n.Bečvou, žel.st.",
            distance: 0.7,
            line: '',
            route: "ujweI_v_lGa@_Ai@u@w@y@u@w@y@w@y@w@y@w@y@wA",
            delays: {
                averageDelay: 0,
                currentDelay: 0,
                pastDelays: []
            }
        },
        {
            startTime: "2025-07-23T08:25:00Z",
            endTime: "2025-07-23T08:40:00Z",
            modeOfTransport: "rail",
            from: "Střítež n.Bečvou, žel.st.",
            to: "Valašské Meziříčí, žel.st.",
            distance: 10,
            line: "S6",
            route: "ojweI{|u_G_@aAq@sBq@wBc@cAa@q@y@aAu@{Aq@uAw@yA",
            delays: {
                averageDelay: 3,
                currentDelay: 0,
                pastDelays: []
            }
        }
    ],
    totalTransfers: 2,
    totalEmissions: 0,
    via: "Valašské Meziříčí",
    lowestTime: false,
    lowestEmissions: false
};

export const publicTransportTripWithWalkWithDelay: TripResult = {
    ...publicTransportTripWithWalkNoDelay, legs: [
        {...publicTransportTripWithWalkNoDelay.legs[0], delays: { averageDelay: 0, currentDelay: 6, pastDelays: []  }},
        publicTransportTripWithWalkNoDelay.legs[1], publicTransportTripWithWalkNoDelay.legs[2]],
}

export const carTripResultToMerge: TripResult = {
    totalTime: 25 * 60,
    totalDistance: 20,
    startTime: "2025-07-21T17:00:00Z",
    endTime: "2025-07-21T17:25:00Z",
    legs: [
        {
            startTime: "2025-07-21T17:00:00Z",
            endTime: "2025-07-21T17:25:00Z",
            modeOfTransport: "car",
            from: "Rožnov pod Radhoštěm",
            to: "Valašské Meziříčí",
            distance: 20,
            line: '',
            route: "uvweI_r_lG~a@eBfXmArLw@`Hw@fEq@dC{@nCaAnCiA",
            delays: {
                averageDelay: 0,
                currentDelay: 0,
                pastDelays: []
            }
        }
    ],
    totalTransfers: 0,
    totalEmissions: 0,
    via: "Valašské Meziříčí",
    lowestTime: false,
    lowestEmissions: false
};

export const publicTransportTripResultToMerge: TripResult = {
    totalTime: 75 * 60,
    totalDistance: 60,
    startTime: "2025-07-21T17:35:00Z",
    endTime: "2025-07-21T18:50:00Z",
    legs: [
        {
            startTime: "2025-07-21T17:35:00Z",
            endTime: "2025-07-21T17:55:00Z",
            modeOfTransport: "bus",
            from: "Valašské Meziříčí, aut.nádraží",
            to: "Frenštát pod Radhoštěm, aut.st.",
            distance: 15,
            line: "941",
            route: "ojweI{|u_G_@aAq@sBq@wBc@cAa@q@y@aAu@{Aq@uAw@yA",
            delays: {
                averageDelay: 0,
                currentDelay: -1,
                pastDelays: []
            }
        },
        {
            startTime: "2025-07-21T18:05:00Z",
            endTime: "2025-07-21T18:50:00Z",
            modeOfTransport: "rail",
            from: "Frenštát pod Radhoštěm, žel.st.",
            to: "Ostrava hl.n.",
            distance: 45, // In kilometers
            line: "S6",
            route: "iqweIwxx`F_@aAy@uAy@eAg@u@u@y@y@w@w@y@w@y@w@yA", // Example polyline for Frenštát to Ostrava (rail)
            delays: {
                averageDelay: 0,
                currentDelay: -1,
                pastDelays: []
            }
        }
    ],
    totalTransfers: 1,
    totalEmissions: 0,
    via: "Ostrava",
    lowestTime: false,
    lowestEmissions: false
};

export const publicTransportTripResultPickup = {...publicTransportTripResultToMerge, via: ''}

export const correctMergedTrip = {
    totalTime: carTripResultToMerge.totalTime + publicTransportTripResultToMerge.totalTime + 10 * 60,
    totalDistance: carTripResultToMerge.totalDistance + publicTransportTripResultToMerge.totalDistance,
    startTime: carTripResultToMerge.startTime,
    endTime: publicTransportTripResultToMerge.endTime,
    legs: [...carTripResultToMerge.legs, ...publicTransportTripResultToMerge.legs],
    totalTransfers: 2,
    via: 'Valašské Meziříčí',
    lowestTime: false,
    lowestEmissions: false,
    totalEmissions: 0
}

export const carTripAfterPublicTransport: TripResult = {
    totalTime: 15 * 60,
    totalDistance: 10,
    startTime: "2025-07-21T19:00:00Z",
    endTime: "2025-07-21T19:15:00Z",
    legs: [
        {
            startTime: "2025-07-21T19:00:00Z",
            endTime: "2025-07-21T19:15:00Z",
            modeOfTransport: "car",
            from: "Ostrava hl.n.",
            to: "Dolní Vítkovice, Ostrava",
            distance: 10,
            line: "N/A",
            route: "oqweIq_s`CgA{@w@u@e@w@y@gA{@u@y@w@y@w@y@w@y@wA",
            delays: {
                averageDelay: 0,
                currentDelay: 0,
                pastDelays: []
            }
        }
    ],
    totalTransfers: 0,
    totalEmissions: 0,
    via: "",
    lowestTime: false,
    lowestEmissions: false
};

export const correctMergedTripPickup: TripResult = {
    totalTime: correctMergedTrip.totalTime + 10 * 60 + 15 * 60,
    totalDistance: correctMergedTrip.totalDistance + carTripAfterPublicTransport.totalDistance,
    startTime: correctMergedTrip.startTime,
    endTime: carTripAfterPublicTransport.endTime,
    legs: [...correctMergedTrip.legs, ...carTripAfterPublicTransport.legs],
    totalTransfers: 3,
    via: "Valašské Meziříčí",
    lowestTime: false,
    lowestEmissions: false,
    totalEmissions: 0
}

export const correctMergedTripReverseReturn: TripResult = {
    totalTime: publicTransportTripResultToMerge.totalTime + 10 * 60 + 15 * 60,
    totalDistance: publicTransportTripResultToMerge.totalDistance + carTripAfterPublicTransport.totalDistance,
    startTime: publicTransportTripResultToMerge.startTime,
    endTime: carTripAfterPublicTransport.endTime,
    legs: [...publicTransportTripResultToMerge.legs, ...carTripAfterPublicTransport.legs],
    totalTransfers: 2,
    via: "Ostrava hl.n.",
    lowestTime: false,
    lowestEmissions: false,
    totalEmissions: 0
}

export const correctMergedPublicTransportTripPickup: TripResult = {
    totalTime: publicTransportTripResultToMerge.totalTime + 10 * 60 + 15 * 60,
    totalDistance: publicTransportTripResultToMerge.totalDistance + carTripAfterPublicTransport.totalDistance,
    startTime: publicTransportTripResultToMerge.startTime,
    endTime: carTripAfterPublicTransport.endTime,
    legs: [...publicTransportTripResultToMerge.legs, ...carTripAfterPublicTransport.legs],
    totalTransfers: 2,
    via: "",
    lowestTime: false,
    lowestEmissions: false,
    totalEmissions: 0
}



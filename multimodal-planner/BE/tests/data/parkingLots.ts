import {OSMWay} from "../../types/ParkingLotOSM.ts";
import {ParkingLot} from "../../../types/ParkingLot.ts";

export const parkingLotNoTags: OSMWay = {
    type: 'way',
    id: 101,
    nodes: [1, 2, 3]
}

export const parkingLotAllTags: OSMWay = {
    ...parkingLotNoTags,
    tags: {
        capacity: '25',
        "capacity:disabled": '10',
        fee: 'yes',
        charge: '10 CZK',
        maxstay: '45 minutes',
        park_ride: 'no',
        name: 'Test parking lot',
        opening_hours: '24/7',
        website: 'http://testparkinglot.org',
        randomTag: 'random'
    }
}

export const correctParkingLotAllTags: Partial<ParkingLot> = {
    capacity: 25,
    capacityDisabled: 10,
    fee: {
        value: 'yes',
        feeConditional: false,
        conditions: [],
        exceptions: []
    },
    charge: '10 CZK',
    maxStay: {
        amountOfTime: 45,
        unit: 'minutes',
        maxStayConditional: false,
        conditions: [],
    },
    parkRide: false,
    name: 'Test parking lot',
    openingHours: {
        isInterval: false,
        openingHours: '24/7'
    },
    website: 'http://testparkinglot.org'
}

export const parkingLotWithConditions: OSMWay = {
    ...parkingLotAllTags,
    tags: {
        ...parkingLotAllTags.tags,
        fee: 'no',
        "fee:conditional": 'yes @ Mo-Fr 09:00-19:00',
        maxstay: '45 minutes',
        "maxstay:conditional": '2 hours @ Mo-Fr 09:00-19:00',
    }
}

export const correctParkingLotsWithConditions: Partial<ParkingLot> = {
    ...correctParkingLotAllTags,
    fee: {
        value: 'no',
        feeConditional: true,
        conditions: [],
        exceptions: [{ dayFrom: 'Mo', dayTo: 'Fr', timeRange: '09:00-19:00' }]
    },
    maxStay: {
        amountOfTime: 45,
        unit: 'minutes',
        maxStayConditional: true,
        conditions: [{
            amountOfTime: 2,
            unit: 'hours',
            validityRange: {
                dayFrom: 'Mo',
                dayTo: 'Fr',
                timeRange: '09:00-19:00'
            }
        }],
    }
}
import type { ResultStatus } from "../types/ResultStatus.ts";
import type { TransferStop } from "../types/TransferStop.ts";

/**
 * Validate the format and range of coordinates
 * @param coords - Coordinates to validate
 */
export function validateCoordinates(coords: unknown): ResultStatus {
    const result: ResultStatus = { error: false, message: '' };
    const message = 'Invalid coordinates';

    if (!Array.isArray(coords) || coords.length !== 2) {
        return { error: true, message } as ResultStatus;
    }

    const [lat, lon] = coords;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
        return { error: true, message } as ResultStatus;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return { error: true, message } as ResultStatus;
    }

    return result;
}

/**
 * Validate the date and time
 * @param requestDate Date to validate
 * @param requestTime Time to validate
 */
export function validateDateAndTime(requestDate: string, requestTime: string): ResultStatus {
    const result: ResultStatus = { error: false, message: '' };
    if (typeof requestDate !== 'string' || typeof requestTime !== 'string') {
        result.error = true;
        result.message = 'Invalid date or time';
        return result;

    }
    const date: Date = new Date(requestDate);
    const time: string = requestTime;
    if (date.toString() === 'Invalid Date') {
        result.error = true;
    }
    const timePattern: RegExp = new RegExp('([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]');
    if (!timePattern.test(time)) {
        result.error = true;
    }
    
    result.message = 'Invalid date or time';

    return result;
}

/**
 * Check if transfer stop is in correct format
 * @param transferStop Transfer stop to validate
 */
export function validateTransferStop(transferStop: Record<string, any>): ResultStatus {
    const result: ResultStatus = { error: false, message: '' };
    if (!("stopId" in transferStop && "stopName" in transferStop && "stopCoords" in transferStop && "hasParking" in transferStop)) {
        result.error = true;
        result.message = 'Missing required fields for transfer stop';
        return result;
    }
    if (typeof transferStop.stopId !== 'string' || typeof transferStop.stopName !== 'string' || typeof transferStop.hasParking !== 'boolean' || !Array.isArray(transferStop.stopCoords)) {
        result.error = true;
        result.message = 'Invalid type of one or more transfer stop properties';
        return result;
    }

    const coordinatesValid = validateCoordinates(transferStop.stopCoords);
    if (coordinatesValid.error) {
        result.error = true;
        result.message = coordinatesValid.message;
    }

    return result;
}

export function validatePickupPoint(pickupPoint: unknown): ResultStatus {
    const result: ResultStatus = {error: false, message: ''}
    const errorMessage = "Invalid pickup point coordinates"
    if (Array.isArray(pickupPoint) && pickupPoint.length === 2 && typeof pickupPoint[0] === "number" && typeof pickupPoint[1] === "number") {
        if (pickupPoint[0] !== 1000 && pickupPoint[1] !== 1000) {
            result.error = validateCoordinates(pickupPoint).error
            result.message = errorMessage
        }
    }
    else {
        result.error = true
        result.message = errorMessage
    }

    return result
}

export function validateComingBackFields(comingBackFields: Record<string, any> | null): ResultStatus {
    const result: ResultStatus = {error: false, message: '' };
    if (comingBackFields === null) {
        return result;
    }
    if (!("returnDate" in comingBackFields) || !("returnTime" in comingBackFields)) {
        result.error = true;
        result.message = 'Required fields missing for coming back';
        return result;
    }
    if (typeof comingBackFields.returnDate !== "string" || typeof comingBackFields.returnTime !== "string") {
        result.error = true;
        result.message = 'Invalid types of coming back fields';
        return result;
    }
    const dateTimeResult = validateDateAndTime(comingBackFields.returnDate, comingBackFields.returnTime);
    if (dateTimeResult.error) {
        result.error = true;
        result.message = "Invalid date or time for coming back";
        return result;
    }
    return result;
}

export function validatePreferences(preferences: Record<string, any>): ResultStatus {
    let result: ResultStatus = { error: false, message: '' };
    if (!preferences.modeOfTransport || !("transferStop" in preferences) || !("minimizeTransfers" in preferences) 
        || !("findBestTrip" in preferences) || !("pickupCoords" in preferences) || !("comingBack" in preferences)) {
        result.error = true;
        result.message = 'Missing required fields for preferences';
        return result
    }

    if (typeof preferences.minimizeTransfers !== 'boolean' || typeof preferences.findBestTrip !== "boolean" || !Array.isArray(preferences.modeOfTransport)) {
        result.error = true;
        result.message = 'Invalid type of one or more trip preferences';
        return result
    }

    if (preferences.transferStop !== null) {
        const transferStopsValid = validateTransferStop(preferences.transferStop);

        if (transferStopsValid.error) {
            result = transferStopsValid
            return result
        }
    }
    const pickupPointResult = validatePickupPoint(preferences.pickupCoords)
    const comingBackResult = validateComingBackFields(preferences.comingBack);

    if (pickupPointResult.error) {
        result = pickupPointResult
    }
    if (comingBackResult.error) {
        result = comingBackResult
    }

    return result
}


/**
 * Validate the trip request input
 * @param body - The request body containing the origin, destination and departure time
 */
export function validateRequestInput(body: Record<string, any>): ResultStatus {
    const result: ResultStatus = { error: false, message: '' };

    if (!body.origin || !body.destination || !body.departureDate || !body.departureTime || !body.preferences) {
        result.error = true;
        result.message = 'Missing required fields';
        return result;
    }
    const originCoordinatesResult: ResultStatus = validateCoordinates(body.origin);
    const destinationCoordinatesResult: ResultStatus = validateCoordinates(body.destination);

    const departureDateAndTimeResult: ResultStatus = validateDateAndTime(body.departureDate, body.departureTime);
    const preferencesValid: ResultStatus = validatePreferences(body.preferences);

    if (originCoordinatesResult.error) {
        result.error = true;
        result.message = originCoordinatesResult.message;
    }

    if (destinationCoordinatesResult.error) {
        result.error = true;
        result.message = destinationCoordinatesResult.message;
    }

    if (departureDateAndTimeResult.error) {
        result.error = true;
        result.message = departureDateAndTimeResult.message;
    }

    if (preferencesValid.error) {
        result.error = true;
        result.message = preferencesValid.message;
    }
    
    return result;
}
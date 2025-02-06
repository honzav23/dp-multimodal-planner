import type { ResultStatus } from "../types/ResultStatus.ts";

/**
 * Validate the coordinates of the origin and destination 
 * @param body - The request body containing the origin and destination coordinates
 */
function validateCoordinates(body: Record<string, any>): ResultStatus {
    const result: ResultStatus = { error: false, message: '' };

    if (body.origin.length !== 2 || body.destination.length !== 2) {
        result.error = true;
    }
    if (typeof body.origin[0] === 'number' && typeof body.origin[1] === 'number' &&
        typeof body.destination[0] === 'number' && typeof body.destination[1] === 'number') {
        
        // Check if origin coordinates are within valid range    
        if (body.origin[0] < -90 || body.origin[0] > 90 || body.origin[1] < -180 || body.origin[1] > 180) {
            result.error = true;
        }

        // Check if destination coordinates are within valid range
        if (body.destination[0] < -90 || body.destination[0] > 90 || body.destination[1] < -180 || body.destination[1] > 180) {
            result.error = true;
        }
    }

    result.message = 'Invalid coordinates';
    return result;
}

function validateDateAndTime(body: Record<string, any>): ResultStatus {
    const result: ResultStatus = { error: false, message: '' };

    const date: Date = new Date(body.departureDate);
    const time: string = body.departureTime;
    if (date.toString() === 'Invalid Date') {
        result.error = true;
    }
    const timePattern: RegExp = new RegExp('([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]');
    if (!timePattern.test(time)) {
        console.log(time)
        result.error = true;
    }
    
    result.message = 'Invalid date or time';

    return result;
}


/**
 * Validate the trip request input
 * @param body - The request body containing the origin, destination and departure time
 */
export function validateRequestInput(body: Record<string, any>): ResultStatus {
    const result: ResultStatus = { error: false, message: '' };

    if (!body.origin || !body.destination || !body.departureDate || !body.departureTime) {
        result.error = true;
        result.message = 'Missing required fields';
        return result;
    }
    const coordinatesResult: ResultStatus = validateCoordinates(body);
    const departureDateAndTimeResult: ResultStatus = validateDateAndTime(body);

    if (coordinatesResult.error) {
        result.error = true;
        result.message = coordinatesResult.message;
    }

    if (departureDateAndTimeResult.error) {
        result.error = true;
        result.message = departureDateAndTimeResult.message;
    }
    
    return result;
}
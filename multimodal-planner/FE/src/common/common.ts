/**
 * @file common.ts
 * @brief File containing functions and variables that other components might use
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import type { TransportMode } from "../../../types/TransportMode";

export const formatDateTime = (dateTime: string): string => {
    const date = new Date(dateTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');

    return `${hoursString}:${minutesString}`;
}

// Route colors based on the current means of transport
export const routeColors: Record<TransportMode, string> = {
    foot: '#009eda',
    car: '#FF0000',
    tram: '#A05A2C',
    bus: '#00E68C',
    rail: '#800000',
    trolleybus: '#008033',
    metro: '#000080'
}
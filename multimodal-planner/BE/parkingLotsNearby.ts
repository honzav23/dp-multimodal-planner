/**
 * @file parkingLotsNearby.ts
 * @brief This file contains functions that are used to get information about parking lost near
 * a certain transfer stop
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { transferStops } from "./api.ts";
import { OSMElement, OSMNode, OSMWay, OSMTag } from "./types/ParkingLotOSM.ts";
import { LatLngTuple } from "../types/TripRequest.ts";
import { ParkingLot, Fee, MaxStay, TimeUnits, DayTimeRange, StayTime, MaxStayCondition, OpeningHours } from "../types/ParkingLot.ts";
import { parseConditionalRestrictions, type Conditional, type Exception } from "osm-conditional-restrictions";

/**
 * Fetch parking lots from Overpass turbo
 * @param stopId Id of a transfer stop which
 */
async function getParkingLotsFromOverpass(stopId: string): Promise<OSMElement[]> {
    const foundTransferStop = transferStops.find(t => t.stopId === stopId)
    if (!foundTransferStop) {
        return []
    }
    const [stopLat, stopLon] = foundTransferStop.stopCoords

    const query = `
        [out:json][timeout:25];
        (
            node["amenity"="parking"]["access"="yes"](around:500,${stopLat},${stopLon});
            way["amenity"="parking"]["access"="yes"](around:500,${stopLat},${stopLon});
            relation["amenity"="parking"]["access"="yes"](around:500,${stopLat},${stopLon});
        );
        out body;
        >;
        out skel qt;
    `
    const controller = new AbortController();
    const timer = setTimeout(() => {
        controller.abort()
    }, 5000)
    const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
    })
    if (!response.ok) {
        return []
    }
    clearTimeout(timer)
    const result = await response.json();
    return result.elements as OSMElement[];
}

/**
 * Creates bounding box for a given parking lot
 * @param parkingLot Parking lot to create bounding box for
 * @param nodesObject Object containing the corners of the bounding box
 */
function getParkingLotBoundingBox(parkingLot: OSMWay, nodesObject: Record<number, OSMNode>): LatLngTuple[] {
    const boundingBox: LatLngTuple[] = parkingLot.nodes.map((n) => [nodesObject[n].lat, nodesObject[n].lon]);
    return boundingBox;
}

/**
 * Converts array of nodes to object where key is the id
 * of a given node
 * @param nodes Nodes to convert
 */
function convertNodesToObject(nodes: OSMNode[]): Record<number, OSMNode> {
    const nodesObject: Record<number, OSMNode> = {};
    for (const node of nodes) {
        nodesObject[node.id] = node;
    }
    return nodesObject;
}

// Check the interval by the first two characters
// because they might identify the day of the week
function isInterval(interval: string): boolean {
    if (interval.length < 2) {
        return false;
    }
    const dayShortcut = interval.slice(0, 2);
    const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    return days.includes(dayShortcut);
}

function extractValidityRange(conditionString: string): DayTimeRange {
    const [days, timeRange] = conditionString.split(" ");
    const [dayFrom, dayTo] = days.split("-");

    const feeCondition: Partial<DayTimeRange> = {}
    feeCondition["dayFrom"] = dayFrom;
    if (dayTo) {
        feeCondition["dayTo"] = dayTo;
    }
    if (timeRange) {
        feeCondition["timeRange"] = timeRange;
    }
    return feeCondition as DayTimeRange;
}

function getConditions(conditionalTree: Conditional, defaultValueIsInterval: boolean): [(DayTimeRange | StayTime)[], (DayTimeRange | StayTime)[]] {
    const conditionsArr: (DayTimeRange | StayTime)[] = [];
    const exceptionsArr: (DayTimeRange | StayTime)[] = [];
    const conditions: Exception[] = conditionalTree.exceptions;
    if (defaultValueIsInterval) {
        const splitConditions = conditionalTree.default!.split(",");
        for (const condition of splitConditions) {
            if (isInterval(condition)) {
                conditionsArr.push(extractValidityRange(condition));
            }
        }
    }
    if (conditions.length === 0) {
        return [conditionsArr, exceptionsArr];
    }

    for (const condition of conditions) {
        if (condition.if && condition.if.type === "Condition") {
            if (isInterval(condition.if.string)) {

                // If the value in a condition is different than the default value,
                // it is an exception, otherwise it is a condition
                if (condition.value === conditionalTree.default) {
                    conditionsArr.push(extractValidityRange(condition.if.string));
                }
                else {
                    exceptionsArr.push(extractValidityRange(condition.if.string));
                }
                    
            }
            else if (condition.if.string.startsWith("stay")) {
                // Get the last three elements of the condition string
                // for example "stay < 30 minutes" => ["<", "30", "minutes"]
                const [operator, timeValue, unit] = condition.if.string.split(" ").slice(-3);
                const stayTime: StayTime = {
                    amountOfTime: parseInt(timeValue) || 0,
                    operator: operator === '<' ? 'less' : 'more',
                    unit: unit as TimeUnits || "minutes"
                };
                if (condition.value === conditionalTree.default) {
                    conditionsArr.push(stayTime);
                } else {
                    exceptionsArr.push(stayTime);
                }
            }
        }
    }
    return [conditionsArr, exceptionsArr];
}

// Returns a Fee object based on the fee conditional tree
function handleFees(feeConditionalTree: Conditional): Fee {
    const valueIsInterval = isInterval(feeConditionalTree.default!);

    const fee: Partial<Fee> = {
        value: feeConditionalTree.default!,
        feeConditional: feeConditionalTree.exceptions.length > 0 || valueIsInterval,
    }
    const [conditions, exceptions] = getConditions(feeConditionalTree, valueIsInterval);
    fee.conditions = conditions;
    fee.exceptions = exceptions;

    return fee as Fee
}

function handleMaxStay(maxStayConditionalTree: Conditional): MaxStay {
    const maxStay: MaxStay = {
        amountOfTime: 0,
        maxStayConditional: maxStayConditionalTree.exceptions.length > 0,
        unit: "minutes",
        conditions: []
    }
    const [time, unit] = maxStayConditionalTree.default!.split(" ");
    maxStay.amountOfTime = parseInt(time) || 0;
    maxStay.unit = unit as TimeUnits || "minutes";

    if (maxStayConditionalTree.exceptions.length > 0) {
        for (const condition of maxStayConditionalTree.exceptions) {
            if (condition.if && condition.if.type === "Condition") {
                const [time, unit] = condition.value.split(" ");
                const maxStayCond: MaxStayCondition = {
                    amountOfTime: parseInt(time) || 0,
                    unit: unit as TimeUnits,
                    validityRange: extractValidityRange(condition.if.string)
                }
                maxStay.conditions.push(maxStayCond);
            }
        }
    }

    return maxStay;
}

function handleOpeningHours(openingHours: string): OpeningHours {
    const openingHoursObj: Partial<OpeningHours> = {};
    if (isInterval(openingHours)) {
        openingHoursObj["openingHours"] = openingHours.split("; ").map(extractValidityRange);
        openingHoursObj["isInterval"] = true;
    } 
    else {
        openingHoursObj["openingHours"] = openingHours;
        openingHoursObj["isInterval"] = false;
    }
    return openingHoursObj as OpeningHours;
}

function extractTags(parkingLot: OSMWay, parkingLotObj: Partial<ParkingLot>) {
    if (!("tags" in parkingLot)) {
        return
    }
    if ("capacity" in parkingLot.tags!) {
        parkingLotObj["capacity"] = parseInt(parkingLot.tags.capacity);
    }
    if ("capacity:disabled" in parkingLot.tags!) {
        const capacityDisabled = parkingLot.tags["capacity:disabled"];
        if (capacityDisabled === "yes") {
            parkingLotObj["capacityDisabled"] = true;
        }
        else if (capacityDisabled === "no") {
            parkingLotObj["capacityDisabled"] = false;
        }
        else {
            parkingLotObj["capacityDisabled"] = parseInt(capacityDisabled);
        }
    }
    if ("fee" in parkingLot.tags!) {
        const feeConditionalTree = parseConditionalRestrictions("fee", parkingLot.tags!);
        parkingLotObj["fee"] = handleFees(feeConditionalTree)
    }
    if ("maxstay" in parkingLot.tags!) {
        const maxStayConditionalTree = parseConditionalRestrictions("maxstay", parkingLot.tags!);
        parkingLotObj["maxStay"] = handleMaxStay(maxStayConditionalTree);
    }

    if ("park_ride" in parkingLot.tags!) {
        parkingLotObj["parkRide"] = parkingLot.tags.park_ride !== "no";
    }

    if ("opening_hours" in parkingLot.tags!) {
        parkingLotObj["openingHours"] = handleOpeningHours(parkingLot.tags.opening_hours);
    }
    const keys = ["charge", "name", "website"]
    for (const key of keys as (keyof ParkingLot)[]) {
        if (key in parkingLot.tags!) {
            parkingLotObj[key] = parkingLot.tags![key as keyof OSMTag];
        }
    }
}

async function fetchParkingLots(stopId: string) {
    const osmParkingLots = await getParkingLotsFromOverpass(stopId);
    const osmParkingLotsNodes: OSMNode[] = osmParkingLots.filter((p) => p.type === "node")
    const nodesObject = convertNodesToObject(osmParkingLotsNodes);

    const osmParkingLotsWays: OSMWay[] = osmParkingLots.filter((p) => p.type === "way")

    const parkingLots: ParkingLot[] = []

    for (const parkingLot of osmParkingLotsWays) {
        const parkingLotObj: Partial<ParkingLot> = {}
        parkingLotObj.polygon = getParkingLotBoundingBox(parkingLot, nodesObject)
        extractTags(parkingLot, parkingLotObj)

        parkingLots.push(parkingLotObj as ParkingLot)
    }

    return parkingLots
}

export { fetchParkingLots, extractTags, handleFees, handleMaxStay }
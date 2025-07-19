/**
 * @file ParkingLot.ts
 * @brief Defines the properties that a parking lot has
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */


export type ParkingLot = {
    polygon: [number, number][]
    capacity?: number,
    capacityDisabled?: boolean | number,
    fee?: Fee,
    charge?: string,
    maxStay?: MaxStay,
    parkRide?: boolean,
    name?: string,
    openingHours?: OpeningHours,
    website?: string
}

export type TimeUnits = 'minutes' | 'hours' | 'days'

export type DayTimeRange = {
    dayFrom: string,
    dayTo?: string,
    timeRange: string
}

export type MaxStay = {
    amountOfTime: number,
    unit: TimeUnits,
    maxStayConditional: boolean,
    conditions: MaxStayCondition[]
}

export type MaxStayCondition = {
    amountOfTime: number,
    unit: TimeUnits,
    validityRange: DayTimeRange
}

export type Fee = {
    value: string,
    feeConditional: boolean,
    conditions: (DayTimeRange | StayTime)[],
    exceptions: (DayTimeRange | StayTime)[]
}

export type StayTime = {
    amountOfTime: number,
    operator: 'less' | 'more',
    unit: TimeUnits,
}

interface OpeningHoursString {
    isInterval: false,
    openingHours: string
}

interface OpeningHoursInterval {
    isInterval: true,
    openingHours: DayTimeRange[]
}

export type OpeningHours = OpeningHoursString | OpeningHoursInterval
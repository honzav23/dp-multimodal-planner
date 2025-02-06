import { TripResult } from "../../../types/TripResult"

export const testTrip: TripResult = {
    totalTime: "1h 55min",
    totalDistance: 11.2,
    startTime: "10:55",
    endTime: "14:00",
    trip: [
        {startTime: "10:55", endTime: "11:15", modeOfTransport: "car", from: "Vyškov", to: "Vyškov, žel. st.", line: "", route: ""},
        {startTime: "11:18", endTime: "13:30", modeOfTransport: "train", from: "Vyškov, žel. st", to: "Brno, hl. n.", line: "R8", route: ""},
        {startTime: "13:40", endTime: "14:00", modeOfTransport: "bus", from: "Brno, hl. n.", to: "Technologický park", line: "12", route: ""}
    ]
}
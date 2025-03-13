export type AvailableTrip = {
    shape_id: number,
    stops: string,
    trips: { id: number, dep_time: number }[]
}
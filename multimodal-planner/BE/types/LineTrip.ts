export type LineTrip = {
    route_short_name: string,
    route_color: string,
    trips: { shape_id: string, stops: string }[]
}
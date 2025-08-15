export type RealtimeVehicleInfo = {
    geometry: {
        x: number,
        y: number,
        spatialReference: {
            wkid: number
        }
    },
    attributes: {
        id: string,
        vtype: number,
        ltype: number,
        lat: number,
        lng: number,
        bearing: number,
        lineid: number,
        linename: string,
        routeid: number,
        course: string,
        lf: "true" | "false",
        delay: number,
        laststopid: number,
        finalstopid: number,
        isinactive: "true" | "false",
        lastupdate: string,
        globalid: string
    }
}
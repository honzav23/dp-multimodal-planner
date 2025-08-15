import {WazeAlert, WazeEvents, WazeJam} from "../types/WazeEvents.ts";
import KDBush from "kdbush";
import RBush from 'rbush'
import polyline from "polyline-codec";
import {TripResult} from "../types/TripResult.ts";

const FETCHING_INTERVAL = 2 * 60 * 1000; // 2 minutes

export class WazeManager {
    private static instance: WazeManager;
    private baseWazeEventsObject: WazeEvents = {
        alerts: [],
        endTimeMilis: 0,
        startTimeMilis: 0,
        startTime: '',
        endTime: '',
        jams: []
    }
    private wazeEvents: WazeEvents;
    private alertIndex?: KDBush;
    private jamIndex?: RBush;
    private readonly wazeUrl: string | undefined;

    constructor(wazeUrl: string | undefined) {
        this.wazeUrl = wazeUrl
        this.wazeEvents = {...this.baseWazeEventsObject}
    }

    public static getInstance(wazeUrl: string | undefined): WazeManager {
        if (!WazeManager.instance) {
            WazeManager.instance = new WazeManager(wazeUrl);
        }
        return WazeManager.instance;
    }

    public getBaseWazeEventsObject(): WazeEvents {
        return {...this.baseWazeEventsObject}
    }

    public getWazeData(): WazeEvents {
        return this.wazeEvents
    }

    public findNearestWazeEvents(trips: TripResult[]) {
        const wazeEvents = this.getWazeData()
        for (const trip of trips) {
            const alertIndices = new Set<number>()
            const jamIndices = new Set<number>()
            for (const leg of trip.legs) {

                // Waze doesn't work with trains
                if (leg.modeOfTransport !== 'rail') {
                    const newAlertIds = this.findNearestAlerts(leg.route)
                    newAlertIds.forEach(id => alertIndices.add(id))
                    const newJamIds = this.findNearestJams(leg.route)
                    newJamIds.forEach(id => jamIndices.add(id))
                }
            }
            const alerts = Array.from(alertIndices).map(id => wazeEvents.alerts[id])
            const jams = Array.from(jamIndices).map(id => wazeEvents.jams[id])
            this.removeAlertsRelatedToClosedRoads(alerts, jams)

            trip.wazeEvents.alerts = alerts
            trip.wazeEvents.jams = jams
        }
    }

    public async startFetchingWazeData() {
        if (this.wazeUrl === undefined) {
            return
        }
        await this.fetchWazeData()
        this.createAlertIndex()
        this.createJamIndex()
        setInterval(async () => {
            await this.fetchWazeData()
            this.createAlertIndex()
            this.createJamIndex()
        }, FETCHING_INTERVAL)
    }

    private removeAlertsRelatedToClosedRoads(alerts: WazeAlert[], jams: WazeJam[]) {
        for (const jam of jams) {
            const foundIndex = alerts.findIndex((a) => a.uuid === jam.blockingAlertUuid && a.type === 'ROAD_CLOSED')
            if (foundIndex !== -1) {
                alerts.splice(foundIndex, 1)
                jam.roadClosed = true
            }

            // The alert might not have been found near the route
            else {
                const globalFoundIndex = this.wazeEvents.alerts.findIndex((a) => a.uuid === jam.blockingAlertUuid && a.type === 'ROAD_CLOSED')
                if (globalFoundIndex !== -1) {
                    jam.roadClosed = true
                }
            }
        }
    }

    private convertFromEpsg4326ToEpsg3857(x: number, y: number): [number, number] {
        const newX = (x * 20037508.34) / 180;
        let newY = Math.log(Math.tan(((90 + y) * Math.PI) / 360)) / (Math.PI / 180);
        newY = (newY * 20037508.34) / 180;

        return [newX, newY];
    }

    private createAlertIndex() {
        this.alertIndex = new KDBush(this.wazeEvents.alerts.length);
        for (const item of this.wazeEvents.alerts) {
            const convertedCoordinates = this.convertFromEpsg4326ToEpsg3857(item.location.x, item.location.y);
            this.alertIndex.add(...convertedCoordinates);
        }
        this.alertIndex.finish()
    }

    private createJamIndex() {
        const tree = new RBush()
        const jamsEpsg3857Coords = this.wazeEvents.jams.map(j => {
            return j.line.map((l) => this.convertFromEpsg4326ToEpsg3857(l.x, l.y))
        })

        const jamsBoundingBoxes = jamsEpsg3857Coords.map((jam, i) => this.createBoundingBoxForJam(jam, i))
        tree.load(jamsBoundingBoxes)
        this.jamIndex = tree
    }

    private createBoundingBoxForJam(jamLine: [number, number][], jamIndex: number): Record<string, number> {
        const minX = jamLine.reduce((minX, current) => current[0] < minX ? current[0] : minX, jamLine[0][0])
        const minY = jamLine.reduce((minY, current) => current[1] < minY ? current[1] : minY, jamLine[0][1])
        const maxX = jamLine.reduce((maxX, current) => current[0] > maxX ? current[0] : maxX, jamLine[0][0])
        const maxY = jamLine.reduce((maxY, current) => current[1] > maxY ? current[1] : maxY, jamLine[0][1])

        return {minX, minY, maxX, maxY, index: jamIndex}
    }


    // Points in format [lat, lng] in epsg 3857
    private createBoundingBoxForLine(p1: [number, number], p2: [number, number]): [number, number, number, number] {
        const distanceToleranceInMeters = 10

        const dx = p2[0] - p1[0]
        const dy = p2[1] - p1[1]

        const lineLength = Math.sqrt(dx * dx + dy * dy);
        const xPerp = dy / lineLength;
        const yPerp = -dx / lineLength;

        const bbp1a: [number, number] = [p1[0] + distanceToleranceInMeters * xPerp, p1[1] + distanceToleranceInMeters * yPerp];
        const bbp1b: [number, number] = [p1[0] - distanceToleranceInMeters * xPerp, p1[1] - distanceToleranceInMeters * yPerp];
        const bbp2a: [number, number] = [p2[0] + distanceToleranceInMeters * xPerp, p2[1] + distanceToleranceInMeters * yPerp];
        const bbp2b: [number, number] = [p2[0] - distanceToleranceInMeters * xPerp, p2[1] - distanceToleranceInMeters * yPerp];

        const xs = [bbp1a[0], bbp1b[0], bbp2a[0], bbp2b[0]];
        const ys = [bbp1a[1], bbp1b[1], bbp2a[1], bbp2b[1]];

        return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }

    private getBoundingBoxesForPolyline(polylineString: string): [number, number, number, number][]  {
        const decodedCoords = polyline.decode(polylineString, 5)

        // Need to switch the order because the format is [lat, lng]
        const coordsEpsg3857 = decodedCoords.map((c) => this.convertFromEpsg4326ToEpsg3857(c[1], c[0]))
        const boundingBoxes = []

        for (let i = 0; i < coordsEpsg3857.length - 1; i++) {
            boundingBoxes.push(this.createBoundingBoxForLine(coordsEpsg3857[i], coordsEpsg3857[i + 1]))
        }
        return boundingBoxes
    }

    private findNearestAlerts(polylineString: string) {
        if (!this.alertIndex) {
            return []
        }
        const boundingBoxes = this.getBoundingBoxesForPolyline(polylineString);
        const foundAlertIndices: number[] = []

        for (const boundingBox of boundingBoxes) {
            foundAlertIndices.push(...this.alertIndex.range(...boundingBox))
        }
        return foundAlertIndices;
    }

    private findNearestJams(polylineString: string): number[] {
        if (!this.jamIndex) {
            return []
        }
        const boundingBoxes = this.getBoundingBoxesForPolyline(polylineString);
        const foundJamIndices: number[] = []

        for (const boundingBox of boundingBoxes) {
            const res = this.jamIndex.search({ minX: boundingBox[0], minY: boundingBox[1], maxX: boundingBox[2], maxY: boundingBox[3] })
            foundJamIndices.push(...res.map(r => r.index))
        }
        return foundJamIndices
    }

    private async fetchWazeData() {
        if (this.wazeUrl === undefined) {
            return
        }
        try {
            const wazeResponse = await fetch(this.wazeUrl)
            if (!wazeResponse.ok) {
                return
            }
            const wazeResponseBody = (await wazeResponse.json()) as WazeEvents

            for (const jam of wazeResponseBody.jams) {
                jam.roadClosed = false
            }
            this.wazeEvents = wazeResponseBody
        }
        catch {
            console.log("Unable to connect to Waze, trying again...")
            setTimeout(this.fetchWazeData, 10000)
        }
    }
}
import {WazeAlert, WazeEvents, WazeJam} from "../types/WazeEvents.ts";
import KDBush from "kdbush";
import RBush from 'rbush'
import polyline from "polyline-codec";
import {TripResult} from "../types/TripResult.ts";
import type {BoundingBox, LineBoundingBoxPair, WazeRTreeItem} from "./types/WazeRTree.ts";

export class WazeManager {
    private static instance: WazeManager;
    private static FETCHING_INTERVAL = 2 * 60 * 1000; // Two minutes
    private static SQUARED_DISTANCE_TOLERANCE = 100
    private static COSINE_TOLERANCE = 0.98 // Approximately 10 degrees
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
    private jamIndex?: RBush<WazeRTreeItem>;
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
            const alertIndicesSet = new Set<number>()
            const allJamsIndexToOrderMapping: Record<string, [number, number]> = {}
            let removedJamIndicesSet = new Set<number>()
            for (const leg of trip.legs) {

                // Waze doesn't work with trains
                if (leg.modeOfTransport === 'rail') {
                    continue
                }
                const lineBoundingBoxesPairs = this.getLineBoundingBoxesPairs(leg.route)

                const alertIndices = this.findNearestAlerts(lineBoundingBoxesPairs)
                alertIndices.forEach(idx => alertIndicesSet.add(idx))

                const [currentIndexToOrderMapping, removedJamIndicesTemp] = this.findNearestJams(lineBoundingBoxesPairs)
                removedJamIndicesSet = removedJamIndicesSet.union(removedJamIndicesTemp)
                this.mergeJamMappings(allJamsIndexToOrderMapping, currentIndexToOrderMapping)
            }
            const alertIndicesToRemove = Array.from(removedJamIndicesSet).filter(idx => !(idx in allJamsIndexToOrderMapping))
            const alerts = Array.from(alertIndicesSet).map(id => wazeEvents.alerts[id])
            const jams: WazeJam[] = this.getFinalJams(allJamsIndexToOrderMapping)
            this.removeAlertsRelatedToClosedRoads(alerts, jams, alertIndicesToRemove)

            trip.wazeEvents.alerts = alerts
            trip.wazeEvents.jams = jams
        }
    }

    private getFinalJams(allJamsIndexToOrderMapping: Record<string, [number, number]>) {
        return Object.keys(allJamsIndexToOrderMapping).map((idx) => {
            const arrIdx = parseInt(idx)
            const correspondingJam: WazeJam = {...this.wazeEvents.jams[arrIdx]}
            correspondingJam.line = this.wazeEvents.jams[arrIdx].line.slice(allJamsIndexToOrderMapping[idx][0],
                allJamsIndexToOrderMapping[idx][1] + 2)
            return correspondingJam
        })
    }

    private mergeJamMappings(targetMapping: Record<string, [number, number]>, sourceMapping: Record<string, [number, number]>) {
        for (const key in sourceMapping) {
            if (!(key in targetMapping)) {
                targetMapping[key] = sourceMapping[key]
            }
            else {
                targetMapping[key] = [Math.min(targetMapping[key][0], sourceMapping[key][0]),
                    Math.max(targetMapping[key][1], sourceMapping[key][1])]
            }
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
        }, WazeManager.FETCHING_INTERVAL)
    }

    private removeAlertsRelatedToClosedRoads(alerts: WazeAlert[], jams: WazeJam[], alertIndicesToRemove: number[]) {
        for (const alertIdx of alertIndicesToRemove) {
            const jamUuid = this.wazeEvents.jams[alertIdx].uuid
            const foundJam = jams.find(j => j.uuid === jamUuid)
            if (foundJam) {
                continue
            }
            const foundIndex = alerts.findIndex(a =>  a.uuid === this.wazeEvents.jams[alertIdx].blockingAlertUuid && a.type === 'ROAD_CLOSED')
            if (foundIndex !== -1) {
                alerts.splice(foundIndex, 1)
            }
        }
        for (const jam of jams) {
            const foundIndex = alerts.findIndex(a => a.uuid === jam.blockingAlertUuid && a.type === 'ROAD_CLOSED')
            if (foundIndex !== -1) {
                alerts.splice(foundIndex, 1)
                jam.roadClosed = true
            }

            // The alert might not have been found near the route
            else {
                const globalFoundIndex = this.wazeEvents.alerts.findIndex(a => a.uuid === jam.blockingAlertUuid && a.type === 'ROAD_CLOSED')
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
        const tree = new RBush<WazeRTreeItem>()
        const jamsEpsg3857Coords = this.wazeEvents.jams.map(j => {
            return j.line.map((l) => this.convertFromEpsg4326ToEpsg3857(l.x, l.y))
        })
        const wazeRTreeItems: WazeRTreeItem[] = jamsEpsg3857Coords.map((jamLine, idx) => {
            const jamRTreeItem: WazeRTreeItem[] = []
            for (let i = 0; i < jamLine.length - 1; i++) {
                const lineBoundingBox = this.createBoundingBoxForLine(jamLine[i], jamLine[i + 1], 0)
                if (!lineBoundingBox) {
                    continue
                }
                jamRTreeItem.push({
                    ...lineBoundingBox,
                    index: idx,
                    lineOrder: i
                })
            }
            return jamRTreeItem;
        }).flat()
        tree.load(wazeRTreeItems)

        this.jamIndex = tree
    }

    // Points in format [lat, lng] in epsg 3857
    // Returns an array [minX, minY, maxX, maxY]
    private createBoundingBoxForLine(p1: [number, number], p2: [number, number], distanceToleranceInMeters = 10): BoundingBox | null {

        const dx = p2[0] - p1[0]
        const dy = p2[1] - p1[1]

        const lineLength = Math.sqrt(dx * dx + dy * dy);
        if (lineLength === 0) {
            return null
        }
        const xPerp = dy / lineLength;
        const yPerp = -dx / lineLength;

        const bbp1a: [number, number] = [p1[0] + distanceToleranceInMeters * xPerp, p1[1] + distanceToleranceInMeters * yPerp];
        const bbp1b: [number, number] = [p1[0] - distanceToleranceInMeters * xPerp, p1[1] - distanceToleranceInMeters * yPerp];
        const bbp2a: [number, number] = [p2[0] + distanceToleranceInMeters * xPerp, p2[1] + distanceToleranceInMeters * yPerp];
        const bbp2b: [number, number] = [p2[0] - distanceToleranceInMeters * xPerp, p2[1] - distanceToleranceInMeters * yPerp];

        const xs = [bbp1a[0], bbp1b[0], bbp2a[0], bbp2b[0]];
        const ys = [bbp1a[1], bbp1b[1], bbp2a[1], bbp2b[1]];

        return {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys)
        };
    }

    private getLineBoundingBoxesPairs(polylineString: string): LineBoundingBoxPair[] {
        const decodedCoords = polyline.decode(polylineString, 5)

        // Need to switch the order because the format is [lat, lng]
        const coordsEpsg3857 = decodedCoords.map((c) => this.convertFromEpsg4326ToEpsg3857(c[1], c[0]))
        const lineBoundingBoxPairs: LineBoundingBoxPair[] = []

        for (let i = 0; i < coordsEpsg3857.length - 1; i++) {
            const bb = this.createBoundingBoxForLine(coordsEpsg3857[i], coordsEpsg3857[i + 1])
            if (!bb) {
                continue
            }
            lineBoundingBoxPairs.push([coordsEpsg3857[i], coordsEpsg3857[i + 1], bb])
        }
        return lineBoundingBoxPairs
    }

    private calculateSquareDistanceBetweenPointAndLine(point: [number, number], linePoint1: [number, number], linePoint2: [number, number]): number {
        const distanceBetweenAlertAndLine = Math.pow((linePoint2[0] - linePoint1[0]) * (linePoint1[1] - point[1]) - (linePoint1[0] - point[0]) * (linePoint2[1] - linePoint1[1]), 2) /
            (Math.pow(linePoint2[0] - linePoint1[0], 2) + Math.pow(linePoint2[1] - linePoint1[1], 2))

        return distanceBetweenAlertAndLine
    }

    private twoLinesIntersect(line1StartPoint: [number, number], line1Endpoint: [number, number],
                              line2StartPoint: [number, number], line2Endpoint: [number, number]): boolean {

        const orientation = (p: [number, number], q: [number, number], r: [number, number]): number => {
            const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);

            // collinear
            if (val === 0) {
                return 0
            }

            // clock or counterclock wise
            // 1 for clockwise, 2 for counterclockwise
            return (val > 0) ? 1 : -1;
        }

        const onSegment = (p: [number, number], q: [number, number], r: [number, number]): boolean => {
            return (q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) && q[1] <= Math.max(p[1], r[1]) &&
                q[1] >= Math.min(p[1], r[1]));
        }

        const o1 = orientation(line1StartPoint, line1Endpoint, line2StartPoint)
        const o2 = orientation(line1StartPoint, line1Endpoint, line2Endpoint)
        const o3 = orientation(line2StartPoint, line2Endpoint, line1StartPoint)
        const o4 = orientation(line2StartPoint, line2Endpoint, line1Endpoint)

        // General case - no line is subline of another one
        if (o1 !== o2 && o3 !== o4) {
            return true
        }

        // Special cases
        if (o1 === 0 && onSegment(line1StartPoint, line2StartPoint, line1Endpoint))  {
            return true
        }
        if (o2 === 0 && onSegment(line1StartPoint, line2Endpoint, line1Endpoint)) {
            return true;
        }
        if (o3 === 0 && onSegment(line2StartPoint, line1StartPoint, line2Endpoint)) {
            return true
        }
        return o4 === 0 && onSegment(line2StartPoint, line1Endpoint, line2Endpoint);
    }

    private calculateDistanceBetweenTwoLines(line1StartPoint: [number, number], line1Endpoint: [number, number],
                                              line2StartPoint: [number, number], line2Endpoint: [number, number]): number {

        if (this.twoLinesIntersect(line1StartPoint, line1Endpoint, line2StartPoint, line2Endpoint)) {
            return 0
        }
        const d1 = this.calculateSquareDistanceBetweenPointAndLine(line1StartPoint, line2StartPoint, line2Endpoint);
        const d2 = this.calculateSquareDistanceBetweenPointAndLine(line1Endpoint, line2StartPoint, line2Endpoint);
        const d3 = this.calculateSquareDistanceBetweenPointAndLine(line2StartPoint, line1StartPoint, line1Endpoint);
        const d4 = this.calculateSquareDistanceBetweenPointAndLine(line2Endpoint, line1StartPoint, line1Endpoint);

        return Math.min(d1, d2, d3, d4)
    }

    private linesHavesSimilarDirection(line1StartPoint: [number, number], line1Endpoint: [number, number],
                                      line2StartPoint: [number, number], line2Endpoint: [number, number]): boolean {
        const line1Vector: [number, number] = [line1Endpoint[0] - line1StartPoint[0], line1Endpoint[1] - line1StartPoint[1]];
        const line2Vector: [number, number] = [line2Endpoint[0] - line2StartPoint[0], line2Endpoint[1] - line2StartPoint[1]];

        const vec1Length = Math.sqrt(line1Vector[0] * line1Vector[0] + line1Vector[1] * line1Vector[1]);
        const vec2Length = Math.sqrt(line2Vector[0] * line2Vector[0] + line2Vector[1] * line2Vector[1]);

        const dotProduct = line1Vector[0] * line2Vector[0] + line1Vector[1] * line2Vector[1];
        return Math.abs(dotProduct / (vec1Length * vec2Length)) > WazeManager.COSINE_TOLERANCE
    }

    private findNearestAlerts(lineBoundingBoxesPairs: LineBoundingBoxPair[]) {
        if (!this.alertIndex) {
            return []
        }
        const foundValidAlertIndices: number[] = []

        for (const lineBoundingBoxPair of lineBoundingBoxesPairs) {
            const foundAlertIndices = this.alertIndex.range(lineBoundingBoxPair[2].minX, lineBoundingBoxPair[2].minY, lineBoundingBoxPair[2].maxX, lineBoundingBoxPair[2].maxY)
            for (const foundIndex of foundAlertIndices) {
                const pointCoords: [number, number] = this.convertFromEpsg4326ToEpsg3857(this.wazeEvents.alerts[foundIndex].location.x, this.wazeEvents.alerts[foundIndex].location.y)
                const dist = this.calculateSquareDistanceBetweenPointAndLine(pointCoords, lineBoundingBoxPair[0], lineBoundingBoxPair[1])
                if (dist <= WazeManager.SQUARED_DISTANCE_TOLERANCE) {
                    foundValidAlertIndices.push(foundIndex)
                }
            }
        }
        return foundValidAlertIndices;
    }

    private findNearestJams(lineBoundingBoxesPairs: LineBoundingBoxPair[]): [Record<string, [number, number]>, Set<number>] {
        if (!this.jamIndex) {
            return [{}, new Set<number>()]
        }
        const indicesToRemove = new Set<number>()
        const foundJamIndices: Record<string, [number, number]> = {}

        for (const lineBoundingBoxPair of lineBoundingBoxesPairs) {
            const searchResult = this.jamIndex.search({...lineBoundingBoxPair[2]})
            for (const res of searchResult) {
                const jamLine = this.wazeEvents.jams[res.index].line.slice(res.lineOrder, res.lineOrder + 2)
                const jamLineEdited = jamLine.map(line => this.convertFromEpsg4326ToEpsg3857(line.x, line.y))
                const distanceBetweenLines = this.calculateDistanceBetweenTwoLines(jamLineEdited[0], jamLineEdited[1], lineBoundingBoxPair[0], lineBoundingBoxPair[1])
                if (distanceBetweenLines > WazeManager.SQUARED_DISTANCE_TOLERANCE || !this.linesHavesSimilarDirection(jamLineEdited[0], jamLineEdited[1], lineBoundingBoxPair[0], lineBoundingBoxPair[1])) {
                    indicesToRemove.add(res.index)
                    continue
                }
                if (!(res.index in foundJamIndices)) {
                    foundJamIndices[res.index] = [res.lineOrder, res.lineOrder]
                }
                else {
                    foundJamIndices[res.index] = [Math.min(foundJamIndices[res.index][0], res.lineOrder), Math.max(foundJamIndices[res.index][1], res.lineOrder)]
                }
            }
        }
        return [foundJamIndices, indicesToRemove]
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
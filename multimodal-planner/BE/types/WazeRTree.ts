export type BoundingBox = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export type LineBoundingBoxPair = [[number, number], [number, number], BoundingBox];

export type WazeRTreeItem = BoundingBox & {
    index: number;
    lineOrder: number; // Indexed from 0
}
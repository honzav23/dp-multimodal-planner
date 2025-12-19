import type { BoundingBox } from "../../types/BoundingBox.ts";

export type LineBoundingBoxPair = [[number, number], [number, number], BoundingBox];

export type WazeRTreeItem = BoundingBox & {
    index: number;
    lineOrder: number; // Indexed from 0
}
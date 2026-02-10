
export type ZoneType = 'Do' | 'Someday' | 'Forget';

export interface Card {
    id: string;
    text: string;
    createdAt: number;
    updatedAt: number;
    zone: ZoneType;
    x: number;
    y: number;
    pinned: boolean;
    lastDraggedAt?: number;
}

export interface ZoneData {
    id: ZoneType;
    title: string;
    // Bounding box for snap detection, calculated at runtime usually
}

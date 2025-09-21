interface AnimationPhase {
    durationMin: number;
    durationMax: number;
}

interface Animation {
    async: boolean;
    loopCount: number;
    defaultStartPhase: number;
    randomStartPhase: boolean;
    phases: AnimationPhase[];
}

interface AppearanceFlags {
    [key: string]: boolean;
}

interface SpriteInfo {
    patternWidth: number;
    patternHeight: number;
    patternDepth: number;
    layers: number;
    spriteIds: number[][][][];
    animation?: Animation;
    sheet?: SpriteSheet;
    sheetPromise?: Promise<void>;
}

interface AppearanceBase {
    id: number;
    flags: AppearanceFlags;
    name?: string;
    description?: string;
    volume?: number;
    weight?: number;
    type?: string;
    category?: string;
    market?: {
        name?: string;
        category?: number;
        showAs?: number;
        restrictVocation?: number;
        requiredLevel?: number;
    };
}

export interface Appearance extends AppearanceBase {
    frameGroup: { [key: string]: SpriteInfo };
}
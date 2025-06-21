declare module 'upng-js' {
    export interface UPNGOptions {
        cnum?: number;  // Color count, 0: all colors (default), otherwise the maximum number of colors
    }

    export interface FrameInfo {
        rect: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        delay: number;
        dispose: number;
        blend: number;
    }

    export interface ImageInfo {
        width: number;
        height: number;
        depth: number;
        ctype: number;  // Color type
        frames: FrameInfo[];
        tabs: { [key: string]: any };
        bpp: number;  // Bytes per pixel
    }

    /**
     * Encode RGBA buffer to PNG
     * @param rgba RGBA pixel data (or array of frames for animation)
     * @param width Image width
     * @param height Image height
     * @param cnum Number of colors (0 for all)
     * @param delays Array of frame delays for animation
     */
    export function encode(
        rgba: Uint8Array | Buffer | ArrayBuffer[],
        width: number,
        height: number,
        cnum?: number,
        delays?: number[]
    ): Uint8Array;

    /**
     * Convert RGBA buffer to an array of bytes in RGBA format
     * @param rgba Source RGBA data
     * @param width Image width
     * @param height Image height
     */
    export function toRGBA8(rgba: Uint8Array | Buffer): Uint8Array;

    /**
     * Decode PNG file
     * @param buffer PNG file data
     */
    export function decode(buffer: ArrayBuffer | Uint8Array | Buffer): {
        width: number;
        height: number;
        data: Uint8Array;
        tabs: object;
    };
}

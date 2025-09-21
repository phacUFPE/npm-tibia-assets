import fs from 'fs';
import lzma from 'lzma';
import { SpriteLayout } from './constants';
import { flipVertical, bgraToRgba } from './image-utils';
import { SpriteSize } from './interfaces/sprite';

export default class SpriteSheet {
    public firstId: number;
    public lastId: number;
    public loaded: boolean;
    public pixels: Uint8Array | null;
    private filePath: string;
    private spriteSize: SpriteSize;

    constructor(filePath: string, firstId: number, lastId: number, layout: number) {
        this.filePath = filePath;
        this.firstId = firstId;
        this.lastId = lastId;
        this.spriteSize = layout <= 3 ? SpriteLayout[layout] : SpriteLayout[3];
        this.loaded = false;
        this.pixels = null;
    }

    /**
     * Gets the width of the sprite sheet.
     * 
     * @returns The width of the sprite sheet in pixels (384).
     */
    static getWidth(): number {
        return 384;
    }

    /**
     * Gets the height of the sprite sheet.
     * 
     * @returns The height of the sprite sheet in pixels (384).
     */
    static getHeight(): number {
        return 384;
    }

    /**
     * Gets the number of bytes in the sprite sheet (width * height * 4).
     * 
     * @returns The number of bytes in the sprite sheet (width * height * 4).
     */
    static getBytesIn(): number {
        return SpriteSheet.getWidth() * SpriteSheet.getHeight() * 4;
    }

    /**
     * Gets the uncompressed size of the sprite sheet (bytes in + 122).
     * 
     * @returns The uncompressed size of the sprite sheet (bytes in + 122).
     */
    static getUncompressedSize(): number {
        return SpriteSheet.getBytesIn() + 122;
    }

    /**
     * Gets the number of bytes in a single row of the sprite sheet (width * 4).
     * 
     * @returns The number of bytes in a single row of the sprite sheet (width * 4).
     */
    static getWidthBytes(): number {
        return SpriteSheet.getWidth() * 4;
    }

    /**
     * Gets the width of a single sprite in pixels.
     * 
     * @returns The width of a single sprite in pixels.
     */
    getSpriteWidth(): number {
        return this.spriteSize.width;
    }

    /**
     * Gets the height of a single sprite in pixels.
     * 
     * @returns The height of a single sprite in pixels.
     */
    getSpriteHeight(): number {
        return this.spriteSize.height;
    }

    /**
     * Gets the total number of sprites in the sheet.
     * 
     * @returns The total number of sprites in the sheet.
     */
    getTotalSprites(): number {
        return this.lastId - this.firstId + 1;
    }

    /**
     * Gets the total number of rows in the sprite sheet.
     * 
     * @returns The total number of rows in the sprite sheet.
     */
    getTotalRows(): number {
        if (this.spriteSize.width === 0) {
            return 0;
        }

        const spritesPerRow = SpriteSheet.getWidth() / this.spriteSize.width;
        if (spritesPerRow === 0) {
            return 0;
        }

        return Math.ceil(this.getTotalSprites() / spritesPerRow);
    }

    /**
     * Loads the sprite sheet from the file.
     * 
     * @param sheet - The sprite sheet to load.
     * @returns An empty promise that resolves when the sprite sheet is loaded.
     */
    static async load(sheet: SpriteSheet): Promise<void> {
        return new Promise((resolve, reject) => {
            const buffer = fs.readFileSync(sheet.filePath);

            let pos = 0;
            while (buffer[pos++] === 0x00);
            pos += 4;
            while ((buffer[pos++] & 0x80) === 0x80);

            const lclppb = buffer[pos++];
            const dictSize = buffer.readUInt32LE(pos);
            pos += 4;
            pos += 8;

            const compressed = buffer.slice(pos);
            const lzmaHeader = Buffer.alloc(5 + 8 + 8);
            lzmaHeader[0] = lclppb;
            lzmaHeader.writeUInt32LE(dictSize, 1);
            lzmaHeader.writeBigUInt64LE(0n, 5);
            lzmaHeader.writeBigUInt64LE(BigInt(compressed.length), 13);

            const fullBuffer = Buffer.concat([lzmaHeader.slice(0, 13), compressed]);

            lzma.decompress(fullBuffer, (result: Uint8Array, error: Error | null) => {
                if (error) {
                    console.error('LZMA decompression failed:', error);
                    reject(error);
                    return;
                }

                const flippedPixels = flipVertical(Buffer.from(result.slice(122)), SpriteSheet.getWidth(), SpriteSheet.getHeight());
                sheet.pixels = bgraToRgba(flippedPixels);
                sheet.loaded = true;
                resolve();
            });
        });
    }
}

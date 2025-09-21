import { Appearance } from './interfaces/appearances';
import { SpriteSize } from './interfaces/sprite';
import SpriteSheet from './sprite-sheet';

export default class AppearanceManager {
    private appearances: Appearance[];
    private sheets: SpriteSheet[];

    constructor(sheets: SpriteSheet[]) {
        this.appearances = [];
        this.sheets = sheets;
    }

    /**
     * Gets the sprite given the sprite id.
     * @param spriteId - The sprite ID
     * @returns The sprite in bytes (RGBA) or null if not available
     */
    async getSprite(spriteId: number): Promise<Uint8Array | null> {
        const sheet = this.getSheetBySpriteId(spriteId);
        if (!sheet) {
            console.debug(`Sprite sheet for sprite ${spriteId} is null`);
            return null;
        }

        if (!sheet.loaded) {
            await SpriteSheet.load(sheet);
        }

        const spriteWidth = sheet.getSpriteWidth();
        const spriteHeight = sheet.getSpriteHeight();

        if (spriteWidth <= 0 || spriteHeight <= 0) {
            console.debug(`Invalid sprite dimensions: width = ${spriteWidth}, height = ${spriteHeight}`);
            return null;
        }

        const spriteOffset = spriteId - sheet.firstId;
        const allColumns = spriteWidth === 32 ? 12 : 6;

        const totalSprites = sheet.getTotalSprites();
        if (spriteOffset < 0 || spriteOffset >= totalSprites) {
            console.debug(`Sprite offset out of range: offset = ${spriteOffset}, total sprites = ${totalSprites}`);
            return null;
        }

        const spriteRow = Math.floor(spriteOffset / allColumns);
        const spriteColumn = spriteOffset % allColumns;

        const totalRows = sheet.getTotalRows();
        if (
            spriteRow < 0 || spriteRow >= totalRows ||
            spriteColumn < 0 || spriteColumn >= allColumns
        ) {
            console.debug(`Invalid sprite row/column: row = ${spriteRow}, column = ${spriteColumn}, total rows = ${totalRows}, allColumns = ${allColumns}`);
            return null;
        }

        if (!sheet.pixels) {
            console.debug(`Sheet data is null for sprite ${spriteId}`);
            return null;
        }

        const bufferSize = SpriteSheet.getHeight() * SpriteSheet.getWidthBytes();
        const pixels = new Uint8Array(spriteWidth * spriteHeight * 4);

        const maxHeight = Math.min((spriteRow + 1) * spriteHeight, SpriteSheet.getHeight());
        const spriteWidthBytes = spriteWidth * 4;

        for (let height = spriteHeight * spriteRow, offset = 0; height < maxHeight; height++, offset++) {
            const bufferDataStart = (height * SpriteSheet.getWidthBytes()) + (spriteColumn * spriteWidthBytes);

            if (bufferDataStart + spriteWidthBytes > bufferSize) {
                console.debug(`Out-of-bounds access during copy: spriteId = ${spriteId}, height = ${height}, offset = ${offset}, bufferDataStart = ${bufferDataStart}, bufferSize = ${bufferSize}`);
                return null;
            }

            const src = sheet.pixels.subarray(bufferDataStart, bufferDataStart + spriteWidthBytes);
            const destOffset = offset * spriteWidthBytes;
            pixels.set(src, destOffset);
        }

        return pixels;
    }

    /**
     * Gets the sprite sheet given the sprite id.
     */
    getSheetBySpriteId(spriteId: number): SpriteSheet | undefined {
        return this.sheets.find(
            (spriteSheet: SpriteSheet) =>
                spriteId >= spriteSheet.firstId && spriteId <= spriteSheet.lastId
        );
    }

    /**
     * Gets the sprite size given the sprite id.
     * 
     * @param spriteId - The sprite id.
     * @returns 
     */
    async getSpriteSize(spriteId: number): Promise<SpriteSize | null> {
        const sheet = this.getSheetBySpriteId(spriteId);
        if (!sheet) {
            console.debug(`Sprite sheet for sprite ${spriteId} is null`);
            return null;
        }

        if (!sheet.loaded) {
            await SpriteSheet.load(sheet);
        }

        const width: number = sheet.getSpriteWidth();
        const height: number = sheet.getSpriteHeight();

        return { width, height };
    }
}

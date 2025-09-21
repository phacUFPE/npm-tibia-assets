import { OutfitData, SpriteSize } from './interfaces'
import { TEMPLATE_OUTFIT_LOOKUP_TABLE } from './constants';

/**
 * Flips a pixel buffer vertically.
 * 
 * @param pixels - The pixel buffer.
 * @param width - The width of the image in pixels.
 * @param height - The height of the image in pixels.
 * @returns The flipped pixel buffer.
 */
export function flipVertical(pixels: Buffer, width: number, height: number): Buffer {
    const flipped = Buffer.alloc(pixels.length);
    const bytesInRow = width * 4;

    for (let y = 0; y < height; y++) {
        const destY = height - y - 1;
        pixels.copy(
            flipped, 
            destY * bytesInRow, 
            y * bytesInRow,
            (y + 1) * bytesInRow
        );
    }

    return flipped;
}

/**
 * Converts a pixel buffer from BGRA format to RGBA format.
 * 
 * @param pixels - The pixel buffer in BGRA format.
 * @returns The pixel buffer in RGBA format.
 */
export function bgraToRgba(pixels: Buffer): Buffer {
    const rgba = Buffer.alloc(pixels.length);

    for (let i = 0; i < pixels.length; i += 4) {
        rgba[i] = pixels[i + 2];     // B -> R
        rgba[i + 1] = pixels[i + 1]; // G -> G
        rgba[i + 2] = pixels[i];     // R -> B
        rgba[i + 3] = pixels[i + 3]; // A -> A
    }

    return rgba;
}


/**
 * Colorizes a pixel in the sprite buffer based on the given tibia color.
 * 
 * @param spriteBuffer - The sprite buffer.
 * @param index - The index of the pixel to colorize.
 * @param color - The tibia color to apply.
 */
export function colorizePixel(spriteBuffer: Uint8Array, index: number, color: number): void {
    const ro = (TEMPLATE_OUTFIT_LOOKUP_TABLE[color] & 0xFF0000) >> 16;
    const go = (TEMPLATE_OUTFIT_LOOKUP_TABLE[color] & 0x00FF00) >> 8;
    const bo = (TEMPLATE_OUTFIT_LOOKUP_TABLE[color] & 0x0000FF);

    spriteBuffer[index + 0] = Math.floor(spriteBuffer[index + 0] * (ro / 255));
    spriteBuffer[index + 1] = Math.floor(spriteBuffer[index + 1] * (go / 255));
    spriteBuffer[index + 2] = Math.floor(spriteBuffer[index + 2] * (bo / 255));
}

/**
 * Colorizes the pixels in the sprite buffer based on the outfit data and template buffer.
 * 
 * @param outfitData - The outfit data.
 * @param spriteBuffer - The sprite buffer to colorize.
 * @param templateBuffer - The template buffer.
 * @param spriteSize - The size of the sprite.
 */
export function colorizePixels(outfitData: OutfitData, spriteBuffer: Uint8Array, templateBuffer: Uint8Array, spriteSize: SpriteSize): void {
    for (let y = 0; y < spriteSize.height; y++) {
        for (let x = 0; x < spriteSize.width; x++) {
            const index = (y * spriteSize.width + x) * 4;
            const alpha = templateBuffer[index + 3];
            if (alpha === 0) {
                continue; // Skip transparent pixels
            }

            const tRed = templateBuffer[index + 0];
            const tGreen = templateBuffer[index + 1];
            const tBlue = templateBuffer[index + 2];

            if (tRed == 255 && tGreen == 255 && tBlue == 0) { // yellow => head
                colorizePixel(spriteBuffer, index, outfitData.lookHead);
            }
            else if (tRed == 255 && tGreen == 0 && tBlue == 0) { // red => body
                colorizePixel(spriteBuffer, index, outfitData.lookBody);
            }
            else if (tRed == 0 && tGreen == 255 && tBlue == 0) { // green => legs
                colorizePixel(spriteBuffer, index, outfitData.lookLegs);
            }
            else if (tRed == 0 && tGreen == 0 && tBlue == 255) { // blue => feet
                colorizePixel(spriteBuffer, index, outfitData.lookFeet);
            }
        }
    }
}

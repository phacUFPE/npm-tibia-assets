import AnimatedImage from './animated-image';
import { APPEARANCE_FIRST_ADDON_OFFSET, APPEARANCE_SECOND_ADDON_OFFSET, APPEARANCE_TEMPLATE_OFFSET } from './constants';
import AppearanceManager from './appearances';
import CatalogContent from './catalog-content';
import { colorizePixels } from './image-utils';
import { Direction, OutfitAnimation } from './enums';
import { OutfitData, SpriteSize } from './interfaces';
import TibiaProtobuf from './tibia-protobuf';
import * as fs from 'fs';

interface SpriteData {
    index: number;
    info: SpriteInfo;
    buffer: Uint8Array;
    size: SpriteSize;
}

interface SpriteInfo {
    animation: {
        spritePhase: any[];
    };
    patternDepth: number;
    patternHeight: number;
    patternWidth: number;
    layers: number;
    spriteId: number[];
}

interface FrameGroup {
    fixedFrameGroup: string;
    spriteInfo: SpriteInfo;
}

export interface Outfit {
    id: number;
    frameGroup: FrameGroup[];
}

export interface Item extends Outfit {};

export default class Generator {
    private appearances: AppearanceManager | null;
    private catalog: CatalogContent;
    private protobuf: TibiaProtobuf;
    private assets: any;
    private intialized: boolean;

    /**
     * Generator constructor.
     * 
     * @param protobuf - The path to the protobuf file or an instance of TibiaProtobuf.
     * @param catalog - The path to the catalog file or an instance of CatalogContent.
     */
    constructor(protobuf: string | TibiaProtobuf, catalog: string | CatalogContent) {
        if (!protobuf) {
            throw new Error('Protobuf path or instance is required');
        }

        if (typeof protobuf === 'string') {
            protobuf = new TibiaProtobuf(protobuf);
        }

        if (typeof catalog === 'string') {
            catalog = new CatalogContent(catalog);
        }

        this.appearances = null;
        this.catalog = catalog;
        this.protobuf = protobuf;
        this.assets = null;
        this.intialized = false;
    }

    /**
     * Initializes the generator.
     */
    async init(): Promise<void> {
        this.assets = await this.protobuf.decode();
        const sheets = this.catalog.loadSpriteSheets();

        this.appearances = new AppearanceManager(sheets);

        this.intialized = true;
    }

    /**
     * Gets the sprite index.
     * 
     * @param spriteInfo - The sprite info.
     * @param layers - The layer index.
     * @param patternX - The pattern X index.
     * @param patternY - The pattern Y index.
     * @param patternZ - The pattern Z index.
     * @param frame - The frame index.
     * @returns The sprite index.
     */
    getSpriteIndex(
        spriteInfo: SpriteInfo,
        layers: number,
        patternX: number,
        patternY: number,
        patternZ: number,
        frame: number
    ): number {
        let index = 0;

        if (spriteInfo.animation?.spritePhase?.length > 0) {
            index = frame % spriteInfo.animation.spritePhase.length;
        }

        index = index * spriteInfo.patternDepth + patternZ;
        index = index * spriteInfo.patternHeight + patternY;
        index = index * spriteInfo.patternWidth + patternX;
        index = index * spriteInfo.layers + layers;

        return index;
    }

    /**
     * Draws the addon to the sprite data.
     * 
     * @param outfitData - The outfit data.
     * @param spriteData - The sprite data.
     * @param addon - The addon number (1 or 2).
     * @returns An empty promise that resolves when the addon has been applied.
     */
    private async drawAddon(outfitData: OutfitData, spriteData: SpriteData, addon: number): Promise<void> {
        const addonOffset = addon === 1 ? APPEARANCE_FIRST_ADDON_OFFSET : APPEARANCE_SECOND_ADDON_OFFSET;

        const addonSpriteIndex = spriteData.index + addonOffset;

        if (addonSpriteIndex > spriteData.info.spriteId.length || spriteData.info.layers <= 1) {
            return;
        }

        const addonBuffer = await this.appearances?.getSprite(spriteData.info.spriteId[addonSpriteIndex]);
        if (!addonBuffer) {
            throw Error(`Addon buffer for sprite index ${addonSpriteIndex} is null`);
        }

        for (let y = 0; y < spriteData.size.height; y++) {
            for (let x = 0; x < spriteData.size.width; x++) {
                const index = (y * spriteData.size.width + x) * 4;
                const alpha = addonBuffer[index + 3];
                if (alpha === 0) {
                    continue; // Skip transparent pixels
                }

                spriteData.buffer[index + 0] = addonBuffer[index + 0];
                spriteData.buffer[index + 1] = addonBuffer[index + 1];
                spriteData.buffer[index + 2] = addonBuffer[index + 2];
                spriteData.buffer[index + 3] = addonBuffer[index + 3];
            }
        }

        const addonSpriteData: SpriteData = {
            index: addonSpriteIndex,
            info: spriteData.info,
            buffer: spriteData.buffer,
            size: spriteData.size
        }

        this.drawTemplate(outfitData, addonSpriteData);
    }

    /**
     * Draws the template to the sprite data.
     * 
     * @param outfitData - The outfit data.
     * @param spriteData - The sprite data.
     * @returns An empty promise that resolves when the template has been applied.
     */
    private async drawTemplate(outfitData: OutfitData, spriteData: SpriteData): Promise<void> {
        const templateSpriteIndex = spriteData.index + APPEARANCE_TEMPLATE_OFFSET;

        if (templateSpriteIndex > spriteData.info.spriteId.length || spriteData.info.layers <= 1) {
            return;
        }

        const templateBuffer = await this.appearances?.getSprite(spriteData.info.spriteId[templateSpriteIndex]);
        if (!templateBuffer) {
            throw new Error(`The template draw was aborted, reason: null template buffer`);
        }

        colorizePixels(outfitData, spriteData.buffer, templateBuffer, spriteData.size);
    }

    /**
     * Gets the animated outfit.
     * 
     * @param outfitData - The outfit data.
     * @param frameGroup - The frame group.
     * @param spriteSize - The sprite size.
     * @param direction - The direction.
     * @returns The animated outfit animated image.
     */
    private async getAnimated(
        frameGroup: FrameGroup,
        spriteSize: SpriteSize,
        outfitData?: OutfitData,
        direction?: Direction
    ): Promise<AnimatedImage> {
        const animatedImage = new AnimatedImage(spriteSize.width, spriteSize.height);

        for (let i = 0; i < frameGroup.spriteInfo.animation.spritePhase.length; i++) {
            const spriteIndex = this.getSpriteIndex(frameGroup.spriteInfo, 0, direction ?? Direction.North, 0, 0, i + 1);
            const spriteBuffer = await this.appearances!.getSprite(frameGroup.spriteInfo.spriteId[spriteIndex]);

            if (!spriteBuffer) {
                continue;
            }

            const spriteData: SpriteData = {
                index: spriteIndex,
                info: frameGroup.spriteInfo,
                buffer: spriteBuffer,
                size: spriteSize
            }

            if (outfitData) {
                await this.drawTemplate(outfitData, spriteData);

                if (outfitData.lookAddons === 1 || outfitData.lookAddons === 3) {
                    await this.drawAddon(outfitData, spriteData, 1);
                }
                if (outfitData.lookAddons === 2 || outfitData.lookAddons === 3) {
                    await this.drawAddon(outfitData, spriteData, 2);
                }
            }

            animatedImage.addFrame(spriteData.buffer.buffer as ArrayBuffer, 100);
        }

        return animatedImage;
    }

    /**
     * 
     * Gets the idle outfit.
     * 
     * @param outfitData - The outfit data.
     * @param frameGroup - The frame group.
     * @param spriteSize - The sprite size.
     * @param direction - The direction.
     * @returns The idle outfit animated image.
     */
    private async getIdle(
        frameGroup: FrameGroup,
        spriteSize: SpriteSize,
        outfitData?: OutfitData,
        direction?: Direction
    ): Promise<AnimatedImage> {
        const animatedImage = new AnimatedImage(spriteSize.width, spriteSize.height);

        if (frameGroup.spriteInfo.animation && frameGroup.spriteInfo.animation.spritePhase.length > 0) {
            return await this.getAnimated(frameGroup, spriteSize, outfitData, direction);
        }

        const spriteIndex = this.getSpriteIndex(frameGroup.spriteInfo, 0, direction ?? Direction.North, 0, 0, 0);
        const spriteBuffer = await this.appearances!.getSprite(frameGroup.spriteInfo.spriteId[spriteIndex]);

        if (!spriteBuffer) {
            return animatedImage;
        }

        const spriteData: SpriteData = {
            index: spriteIndex,
            info: frameGroup.spriteInfo,
            buffer: spriteBuffer,
            size: spriteSize
        }

        if (outfitData) {
            await this.drawTemplate(outfitData, spriteData);

            if (outfitData.lookAddons === 1 || outfitData.lookAddons === 3) {
                await this.drawAddon(outfitData, spriteData, 1);
            }
            if (outfitData.lookAddons === 2 || outfitData.lookAddons === 3) {
                await this.drawAddon(outfitData, spriteData, 2);
            }
        }

        animatedImage.addFrame(spriteData.buffer.buffer as ArrayBuffer, 100);

        return animatedImage;
    }

    /**
     * Gets the outfit image data given the outfit id.
     * 
     * @param outfitData - The outfit data.
     * @param direction - The direction of the outfit. Default is South.
     * @param animationType - The animation type of the outfit. Default is Moving.
     * @returns A promise that resolves to a Uint8Array containing the outfit image data.
     */
    async getOutfit(
        outfitData: OutfitData,
        direction: Direction = Direction.South,
        animationType: OutfitAnimation = OutfitAnimation.Idle,
        path: string = ""
    ): Promise<Uint8Array> {
        if (!this.intialized) {
            await this.init();
        }

        if (!this.assets || !this.appearances) {
            throw new Error('Generator not properly initialized');
        }

        const selectedOutfit = this.assets.outfit.find((outfit: Outfit) => outfit.id === outfitData.lookType);

        if (!selectedOutfit) {
            throw new Error(`Outfit with id ${outfitData.lookType} not found.`);
        }

        if (selectedOutfit.frameGroup.length <= 0) {
            throw new Error(`Outfit with id ${outfitData.lookType} has no frame groups.`);
        }

        const frameGroup = selectedOutfit.frameGroup.find(
            (fg: FrameGroup) => fg.fixedFrameGroup === animationType
        );

        if (!frameGroup) {
            throw new Error(`No frame group found for animation type ${animationType}`);
        }

        const spriteSize = await this.appearances.getSpriteSize(frameGroup.spriteInfo.spriteId[0]);
        if (!spriteSize) {
            throw new Error('Could not get sprite size');
        }


        let animatedImage;
        if (animationType === OutfitAnimation.Moving) {
            animatedImage = await this.getAnimated(frameGroup, spriteSize, outfitData, direction);
        } else {
            animatedImage = await this.getIdle(frameGroup, spriteSize, outfitData, direction);
        }

        const imageBuffer = await animatedImage.create();

        if (path) {
            fs.writeFileSync(path, Buffer.from(imageBuffer));
        }

        return imageBuffer;
    }

    /**
     * Gets the item image data given the item id.
     * 
     * @param itemId - The item id.
     * @returns A promise that resolves to a Uint8Array containing the item image data.
     */
    async getItem(itemId: number, path: string = ""): Promise<Uint8Array> {
         if (!this.intialized) {
            await this.init();
        }

        if (!this.assets || !this.appearances) {
            throw new Error('Generator not properly initialized');
        }

        const selectedItem = this.assets.object.find((item: Item) => item.id === itemId);
        if (!selectedItem) {
            throw new Error(`Item with id ${itemId} not found.`);
        }

        if (selectedItem.frameGroup.length <= 0) {
            throw new Error(`Item with id ${itemId} has no frame groups.`);
        }

        const frameGroup = selectedItem.frameGroup[0];
        const spriteSize = await this.appearances.getSpriteSize(frameGroup.spriteInfo.spriteId[0]);
        if (!spriteSize) {
            throw new Error('Could not get sprite size');
        }

        let animatedImage = new AnimatedImage(spriteSize.width, spriteSize.height);

        if (frameGroup.spriteInfo.animation?.spritePhase?.length > 0) {
            animatedImage = await this.getAnimated(frameGroup, spriteSize);
        } else {
            animatedImage = await this.getIdle(frameGroup, spriteSize);
        }

        const imageBuffer = await animatedImage.create();
        
        if (path) {
            fs.writeFileSync(path, Buffer.from(imageBuffer));
        }

        return imageBuffer;
    }
}

export { Generator };

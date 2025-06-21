import Generator from './generator';
import fs from 'fs';

// Main exports
export { default as Generator } from './generator';
export { default as AppearanceManager } from './appearances';
export { default as CatalogContent } from './catalog-content';
export { default as AnimatedImage } from './animated-image';
export { default as SpriteSheet } from './sprite-sheet';
export { default as TibiaProtobuf } from './tibia-protobuf';

// Types and Enums
export { Direction, OutfitAnimation, AssetsType } from './constants';

// Interfaces
export type { CatalogItem } from './catalog-content';
export type { Appearance } from './appearances';

// Utility functions
export { flipVertical, bgraToRgba, colorizePixel, colorizePixels } from './image-utils';

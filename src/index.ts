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
export * from './constants';
export type * from './interfaces';
export * from './enums';

// Interfaces
export type { CatalogItem } from './catalog-content';

// Utility functions
export { flipVertical, bgraToRgba, colorizePixel, colorizePixels } from './image-utils';

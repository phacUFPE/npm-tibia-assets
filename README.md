# npm-tibia-assets

**npm-tibia-assets** provides a collection of assets / data for the game *Tibia*, packaged as an npm (TypeScript) module.  

## Table of Contents

- [Features](#features)  
- [Installation](#installation)  
- [Usage](#usage)
- [API Quick Reference](#api-quick-reference)

---

## Features

- Packs a set of Tibia-related resource files (e.g. images, metadata) into a consumable npm package  
- Written in TypeScript
- Intended to be used in other projects needing Tibia assets
- Load **Tibia appearance data** from `appearances.dat` and `catalog-content.json`
- Generate rendered **outfit sprites** or **item images**
- Supports **directional rendering** and **animated states**
- Exports assets as **PNG buffers** or **PNG files**, ready to be saved or used in web apps
---

## Installation

Assuming the package is published to the npm registry (or a private registry), you can install it via:

```bash
npm install tibia-assets
```

## Usage

### Outfit
Usage example to get an Oufit:

```typescript
import { Generator } from "npm-tibia-assets";
import { Direction, OutfitAnimation } from "npm-tibia-assets/enums";
import * as fs from "fs";

async function main() {
    // Create a new Generator instance with appearance and catalog data
    const gen = new Generator("appearances.dat", "catalog-content.json");

    const outfitData = {
        lookType: 513, // Outfit id
        lookHead: 190, // Outfit Head color
        lookBody: 14, // Outfit Body color
        lookLegs: 33, // Outfit Legs color
        lookFeet: 21, // Outfit Feet color
        lookAddons: 2, // Outfit Addons (First addon = 1, Second addon = 2, All Addons = 3)
    };

    // Generate an outfit buffer facing south, in the moving animation
    const outfitBuffer = await gen.getOutfit(outfitData, Direction.South, OutfitAnimation.Moving);

    // Save the result as a PNG image
    fs.writeFileSync("outfit.png", Buffer.from(outfitBuffer));

    console.log("✅ Outfit image generated: outfit.png");
}

main();
```

### Item
Usage example to get an Item:

```typescript
import { Generator } from "npm-tibia-assets";
import * as fs from "fs";

async function main() {
    // Create a new Generator instance
    const gen = new Generator("appearances.dat", "catalog-content.json");

    // The item id desired
    const itemId = 17233;

    // Generate an item buffer given the item id
    const itemBuffer = await gen.getItem(itemId);

    // Save the result as a PNG image
    fs.writeFileSync("item.png", Buffer.from(itemBuffer));

    console.log("✅ Item image generated: item.png");
}

main();
```

## API Quick Reference
### Generator
#### constructor
```typescript
// Creates a generator instance.
new Generator(appearancesPath: string, catalogPath: string, cache: boolean = false)
```
| Parameter         | Type     | Description                              |
| ----------------- | -------- | ---------------------------------------- |
| `appearancesPath` | `string` | Path to the `appearances.dat` file.      |
| `catalogPath`     | `string` | Path to the `catalog-content.json` file. |
| `cache`           | `boolean`| Boolean to mark if the image data will be cached |


#### init
```typescript
// Loads and decodes protobuf + catalog files. Could be called before using, if not explicity called, will be called when retrieving the data.
generator.init(): Promise<void>
```

#### getOufit
```typescript
// Generates an outfit PNG.
getOutfit(outfitData: OutfitData, direction: Direction = Direction.South, animationType: OutfitAnimation = OutfitAnimation.Idle, path: string = ""): Promise<Uint8Array>
```
| Parameter         | Type               | Description                              |
| ----------------- | --------           | ---------------------------------------- |
| `outfitData`      | `OutfitData`       | The outfit data to be used, containing lookType, lookHead, etc.      |
| `direction`       | `Direction`        | The direction that the outfit will be facing. (North, South, West or East). |
| `animationType`   | `OutfitAnimation`  | The animation type. Idle or Moving. |
| `path`            | `string`           | The path to create the image if filled. |

#### getItem
```typescript
// Generates an outfit PNG.
getItem(itemId: number, path: string = ""): Promise<Uint8Array>
```
| Parameter         | Type               | Description                              |
| ----------------- | --------           | ---------------------------------------- |
| `itemId`          | `number`           | The item id to be generated. |
| `path`            | `string`           | The path to create the image if filled. |

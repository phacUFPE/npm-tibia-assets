# npm-tibia-assets

**npm-tibia-assets** provides a collection of assets / data for the game *Tibia*, packaged as an npm (TypeScript) module.  

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [CLI Tool](#cli-tool)
- [Programmatic Usage](#programmatic-usage)
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

### CLI Tool

The package includes a CLI tool for pre-generating item images and outfit sprites. This is especially useful for production environments where you want to avoid CPU/Memory overhead from generating images on-demand.

#### Installation

After installing the package, the `tibia-assets-generate` command will be available:

```bash
npm install tibia-assets
```

#### Usage

**Generate Items:**
```bash
# Generate all items
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m items

# Generate specific range of items
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -r "1-500"

# Generate specific items by ID
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -r "3031,3043,3050"
```

**Generate Outfits:**
```bash
# Generate all outfits with default colors
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits

# Generate specific outfits with color variations
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits \
  -or "513,514" --look-head "0,10,20" --look-body "0,14" --look-legs "0" --look-feet "0"

# Generate outfits in all directions
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits \
  -or "513" -d "north,east,south,west" -a "idle,moving"

# Generate with addons
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits \
  -or "513" --look-addons "0,1,2,3"
```

**Generate Both Items and Outfits:**
```bash
tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m both \
  -r "1-1000" -or "513-520"
```

**Use in npm scripts:**
```json
{
  "scripts": {
    "generate:items": "tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m items -o ./public/items",
    "generate:outfits": "tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits -or \"513-600\" -o ./public/outfits",
    "prebuild": "npm run generate:items && npm run generate:outfits",
    "build": "your-build-command"
  }
}
```

#### Options

| Option | Alias | Description | Required |
|--------|-------|-------------|----------|
| `--protobuf` | `-p` | Path to appearances.dat protobuf file | Yes |
| `--catalog` | `-c` | Path to catalog-content.json file | Yes |
| `--mode` | `-m` | Generation mode: "items", "outfits", or "both" (default: items) | No |
| `--output` | `-o` | Output directory for generated images (default: `./generated-assets`) | No |

**Item Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--item-range` | `-r` | Item ID range to generate (e.g., "1-100" or "3031,3043,3050") |

**Outfit Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--outfit-range` | `-or` | Outfit ID range to generate (e.g., "1-50" or "513,514") |
| `--direction` | `-d` | Direction(s): north, east, south, west (default: south) |
| `--animation` | `-a` | Animation type(s): idle, moving (default: idle) |
| `--look-head` | | Head color(s) (e.g., "0" or "0,10,20" or "0-153") |
| `--look-body` | | Body color(s) (e.g., "0" or "0,10,20" or "0-153") |
| `--look-legs` | | Legs color(s) (e.g., "0" or "0,10,20" or "0-153") |
| `--look-feet` | | Feet color(s) (e.g., "0" or "0,10,20" or "0-153") |
| `--look-addons` | | Addons: 0 (none), 1 (first), 2 (second), 3 (both) |

#### Output File Naming

**Items:** `{itemId}.png` (e.g., `3031.png`)

**Outfits:** `{outfitId}_{direction}_{animation}_h{head}_b{body}_l{legs}_f{feet}_a{addons}.png`
- Example: `513_south_idle_h0_b14_l33_f21_a2.png`

#### Benefits

- **Performance**: Pre-generate images at build time instead of runtime
- **Reduced CPU/Memory**: Avoid runtime image generation in production
- **Caching**: Skip already generated images for faster subsequent runs
- **Selective Generation**: Generate only specific items/outfits or ranges as needed
- **Color Variations**: Generate multiple color combinations for outfits
- **Directional Sprites**: Generate all 4 directions (north, east, south, west)
- **Animation Support**: Generate both idle and moving animations

### Programmatic Usage

#### Generate Outfits
Usage example to get an Outfit:

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

#### Generate Items
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
// Generates an item PNG.
getItem(itemId: number, path: string = ""): Promise<Uint8Array>
```
| Parameter         | Type               | Description                              |
| ----------------- | --------           | ---------------------------------------- |
| `itemId`          | `number`           | The item id to be generated. |
| `path`            | `string`           | The path to create the image if filled. |

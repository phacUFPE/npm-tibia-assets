#!/usr/bin/env node

import { Generator } from './index';
import { CliOptions } from "./interfaces/cli";
import { Direction, OutfitAnimation } from './enums';
import * as fs from 'fs';
import * as path from 'path';

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    protobuf: '',
    catalog: '',
    output: './generated-assets',
    mode: 'items'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      return options;
    }

    if (arg === '--protobuf' || arg === '-p') {
      options.protobuf = args[++i];
    } else if (arg === '--catalog' || arg === '-c') {
      options.catalog = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--item-range' || arg === '-r') {
      options.itemRange = args[++i];
    } else if (arg === '--outfit-range' || arg === '-or') {
      options.outfitRange = args[++i];
    } else if (arg === '--mode' || arg === '-m') {
      options.mode = args[++i] as 'items' | 'outfits' | 'both';
    } else if (arg === '--direction' || arg === '-d') {
      options.direction = args[++i];
    } else if (arg === '--animation' || arg === '-a') {
      options.animationType = args[++i];
    } else if (arg === '--look-head') {
      options.lookHead = args[++i];
    } else if (arg === '--look-body') {
      options.lookBody = args[++i];
    } else if (arg === '--look-legs') {
      options.lookLegs = args[++i];
    } else if (arg === '--look-feet') {
      options.lookFeet = args[++i];
    } else if (arg === '--look-addons') {
      options.lookAddons = args[++i];
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Tibia Assets Generator CLI

Usage: tibia-assets-generate [options]

Options:
  -p, --protobuf <path>      Path to appearances.dat protobuf file (required)
  -c, --catalog <path>       Path to catalog-content.json file (required)
  -o, --output <path>        Output directory for generated images (default: ./generated-assets)
  -m, --mode <mode>          Generation mode: "items", "outfits", or "both" (default: items)

  Item Options:
  -r, --item-range <range>   Item ID range to generate (e.g., "1-100" or "3031,3043,3050")

  Outfit Options:
  -or, --outfit-range <range>  Outfit ID range to generate (e.g., "1-50" or "513,514")
  -d, --direction <dir>        Direction: north, east, south, west (default: south)
  -a, --animation <type>       Animation: idle, moving (default: idle)
  --look-head <colors>         Head color(s) (e.g., "0" or "0,10,20" or "0-153")
  --look-body <colors>         Body color(s) (e.g., "0" or "0,10,20" or "0-153")
  --look-legs <colors>         Legs color(s) (e.g., "0" or "0,10,20" or "0-153")
  --look-feet <colors>         Feet color(s) (e.g., "0" or "0,10,20" or "0-153")
  --look-addons <addons>       Addons: 0 (none), 1 (first), 2 (second), 3 (both) (default: 0)

  Other:
  -h, --help                   Show this help message

Examples:
  # Generate all items
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m items

  # Generate specific item range
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -r "1-500"

  # Generate specific items
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -r "3031,3043,3050"

  # Generate all outfits with default colors (0,0,0,0)
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits

  # Generate specific outfits with color variations
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits \\
    -or "513,514" --look-head "0,10,20" --look-body "0,14" --look-legs "0" --look-feet "0"

  # Generate outfit with all directions
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m outfits \\
    -or "513" -d "north,east,south,west" --animation "idle,moving"

  # Generate both items and outfits
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -m both \\
    -r "1-1000" -or "513-520"

  # Custom output directory
  tibia-assets-generate -p ./assets/appearances.dat -c ./assets/catalog-content.json -o ./public/assets
  `);
}

function parseRange(rangeStr: string): number[] {
  const items: Set<number> = new Set();

  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();

    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
      if (isNaN(start) || isNaN(end)) {
        console.error(`Invalid range: ${trimmed}`);
        continue;
      }
      for (let i = start; i <= end; i++) {
        items.add(i);
      }
    } else {
      const itemId = parseInt(trimmed, 10);
      if (!isNaN(itemId)) {
        items.add(itemId);
      }
    }
  }

  return Array.from(items).sort((a, b) => a - b);
}

function parseDirections(directionStr?: string): Direction[] {
  if (!directionStr) {
    return [Direction.South];
  }

  const directions: Direction[] = [];
  const parts = directionStr.toLowerCase().split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    switch (trimmed) {
      case 'north':
        directions.push(Direction.North);
        break;
      case 'east':
        directions.push(Direction.East);
        break;
      case 'south':
        directions.push(Direction.South);
        break;
      case 'west':
        directions.push(Direction.West);
        break;
      default:
        console.warn(`Unknown direction: ${trimmed}, skipping`);
    }
  }

  return directions.length > 0 ? directions : [Direction.South];
}

function parseAnimationTypes(animationStr?: string): OutfitAnimation[] {
  if (!animationStr) {
    return [OutfitAnimation.Idle];
  }

  const animations: OutfitAnimation[] = [];
  const parts = animationStr.toLowerCase().split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    switch (trimmed) {
      case 'idle':
        animations.push(OutfitAnimation.Idle);
        break;
      case 'moving':
        animations.push(OutfitAnimation.Moving);
        break;
      default:
        console.warn(`Unknown animation type: ${trimmed}, skipping`);
    }
  }

  return animations.length > 0 ? animations : [OutfitAnimation.Idle];
}

async function generateItems(options: CliOptions): Promise<void> {
  if (!options.protobuf || !options.catalog) {
    console.error('Error: --protobuf and --catalog are required');
    printHelp();
    process.exit(1);
  }

  if (!fs.existsSync(options.protobuf)) {
    console.error(`Error: Protobuf file not found: ${options.protobuf}`);
    process.exit(1);
  }

  if (!fs.existsSync(options.catalog)) {
    console.error(`Error: Catalog file not found: ${options.catalog}`);
    process.exit(1);
  }

  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }

  console.log('Initializing generator...');
  const generator = new Generator(options.protobuf, options.catalog, false);
  await generator.init();

  let itemIds: number[];

  if (options.itemRange) {
    itemIds = parseRange(options.itemRange);
    console.log(`Generating ${itemIds.length} items from range: ${options.itemRange}`);
  } else {
    // @ts-ignore
    const assets = generator['assets'];
    if (!assets || !assets.object) {
      console.error('Error: Could not load assets from protobuf file');
      process.exit(1);
    }
    itemIds = assets.object.map((obj: any) => obj.id).filter((id: number) => id > 0);
    console.log(`Generating all ${itemIds.length} items...`);
  }

  let generated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i];
    const outputPath = path.join(options.output, `${itemId}.png`);

    if (fs.existsSync(outputPath)) {
      skipped++;
      if (i % 100 === 0) {
        console.log(`Progress: ${i + 1}/${itemIds.length} (Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed})`);
      }
      continue;
    }

    try {
      await generator.getItem(itemId, outputPath);
      generated++;

      if (i % 100 === 0) {
        console.log(`Progress: ${i + 1}/${itemIds.length} (Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed})`);
      }
    } catch (error) {
      failed++;
      if (process.env.DEBUG) {
        console.error(`Failed to generate item ${itemId}:`, error);
      }
    }
  }

  console.log('\n=== Item Generation Complete ===');
  console.log(`Total items processed: ${itemIds.length}`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output directory: ${path.resolve(options.output)}`);
}

async function generateOutfits(options: CliOptions): Promise<void> {
  if (!options.protobuf || !options.catalog) {
    console.error('Error: --protobuf and --catalog are required');
    printHelp();
    process.exit(1);
  }

  if (!fs.existsSync(options.protobuf)) {
    console.error(`Error: Protobuf file not found: ${options.protobuf}`);
    process.exit(1);
  }

  if (!fs.existsSync(options.catalog)) {
    console.error(`Error: Catalog file not found: ${options.catalog}`);
    process.exit(1);
  }

  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }

  console.log('Initializing generator...');
  const generator = new Generator(options.protobuf, options.catalog, false);
  await generator.init();

  let outfitIds: number[];

  if (options.outfitRange) {
    outfitIds = parseRange(options.outfitRange);
    console.log(`Generating ${outfitIds.length} outfits from range: ${options.outfitRange}`);
  } else {
    // @ts-ignore
    const assets = generator['assets'];
    if (!assets || !assets.outfit) {
      console.error('Error: Could not load assets from protobuf file');
      process.exit(1);
    }
    outfitIds = assets.outfit.map((outfit: any) => outfit.id).filter((id: number) => id > 0);
    console.log(`Generating all ${outfitIds.length} outfits...`);
  }

  const directions = parseDirections(options.direction);
  const animations = parseAnimationTypes(options.animationType);
  const headColors = options.lookHead ? parseRange(options.lookHead) : [0];
  const bodyColors = options.lookBody ? parseRange(options.lookBody) : [0];
  const legsColors = options.lookLegs ? parseRange(options.lookLegs) : [0];
  const feetColors = options.lookFeet ? parseRange(options.lookFeet) : [0];
  const addons = options.lookAddons ? parseRange(options.lookAddons) : [0];

  let generated = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`Configuration:`);
  console.log(`  Directions: ${directions.map(d => Direction[d]).join(', ')}`);
  console.log(`  Animations: ${animations.map(a => a === OutfitAnimation.Idle ? 'Idle' : 'Moving').join(', ')}`);
  console.log(`  Head colors: ${headColors.join(', ')}`);
  console.log(`  Body colors: ${bodyColors.join(', ')}`);
  console.log(`  Legs colors: ${legsColors.join(', ')}`);
  console.log(`  Feet colors: ${feetColors.join(', ')}`);
  console.log(`  Addons: ${addons.join(', ')}`);

  const totalCombinations = outfitIds.length * directions.length * animations.length *
                           headColors.length * bodyColors.length * legsColors.length *
                           feetColors.length * addons.length;

  console.log(`\nTotal outfit combinations to generate: ${totalCombinations}\n`);

  let processed = 0;

  for (const outfitId of outfitIds) {
    for (const direction of directions) {
      for (const animation of animations) {
        for (const headColor of headColors) {
          for (const bodyColor of bodyColors) {
            for (const legsColor of legsColors) {
              for (const feetColor of feetColors) {
                for (const addon of addons) {
                  const outfitData = {
                    lookType: outfitId,
                    lookHead: headColor,
                    lookBody: bodyColor,
                    lookLegs: legsColor,
                    lookFeet: feetColor,
                    lookAddons: addon
                  };

                  const directionName = Direction[direction].toLowerCase();
                  const animationName = animation === OutfitAnimation.Idle ? 'idle' : 'moving';
                  const fileName = `${outfitId}_${directionName}_${animationName}_h${headColor}_b${bodyColor}_l${legsColor}_f${feetColor}_a${addon}.png`;
                  const outputPath = path.join(options.output, fileName);

                  if (fs.existsSync(outputPath)) {
                    skipped++;
                    processed++;
                    if (processed % 100 === 0) {
                      console.log(`Progress: ${processed}/${totalCombinations} (Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed})`);
                    }
                    continue;
                  }

                  try {
                    await generator.getOutfit(outfitData, direction, animation, outputPath);
                    generated++;
                    processed++;

                    if (processed % 100 === 0) {
                      console.log(`Progress: ${processed}/${totalCombinations} (Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed})`);
                    }
                  } catch (error) {
                    failed++;
                    processed++;
                    if (process.env.DEBUG) {
                      console.error(`Failed to generate outfit ${outfitId}:`, error);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  console.log('\n=== Outfit Generation Complete ===');
  console.log(`Total combinations processed: ${totalCombinations}`);
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output directory: ${path.resolve(options.output)}`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  try {
    if (options.mode === 'items') {
      await generateItems(options);
    } else if (options.mode === 'outfits') {
      await generateOutfits(options);
    } else if (options.mode === 'both') {
      await generateItems(options);
      console.log('\n');
      await generateOutfits(options);
    } else {
      console.error(`Error: Invalid mode "${options.mode}". Must be "items", "outfits", or "both"`);
      printHelp();
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

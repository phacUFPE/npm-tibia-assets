import fs from 'fs';
import { AssetsType } from './constants';
import SpriteSheet from './sprite-sheet';

export interface CatalogItem {
    type: AssetsType;
    file: string;
    firstspriteid: number;
    lastspriteid: number;
    spritetype: number;
}

class CatalogContent {
    private path: string;

    /**
     * CatalogContent constructor.
     * 
     * @param path - The path to the catalog JSON file.
     */
    constructor(path: string) {
        this.path = path;
    }

    /**
     * Loads the sprite sheets
     * 
     * @returns The sprite sheets.
     */
    loadSpriteSheets(): SpriteSheet[] {
        let jsonData: string;
        try {
            jsonData = fs.readFileSync(this.path, 'utf-8');
        } catch (err) {
            console.error("Couldn't open catalog file:", this.path);
            return [];
        }

        let jsonArray: CatalogItem[];
        try {
            jsonArray = JSON.parse(jsonData);
        } catch (err) {
            console.error('Invalid JSON file!');
            return [];
        }

        const sheets: SpriteSheet[] = [];

        jsonArray.forEach(json => {
            if (json.type === AssetsType.Sprite) {
                sheets.push(
                    new SpriteSheet(
                        json.file,
                        json.firstspriteid,
                        json.lastspriteid,
                        json.spritetype
                    )
                );
            }
        });

        return sheets;
    }
}

export default CatalogContent;

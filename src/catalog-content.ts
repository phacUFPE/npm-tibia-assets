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
        let jsonData = fs.readFileSync(this.path, 'utf-8');

        let jsonArray: CatalogItem[] = JSON.parse(jsonData);

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

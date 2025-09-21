import fs from 'fs';
import path from 'path';
import * as protobuf from 'protobufjs';

interface AppearanceObject {
    id: string;
    outfit: any[];
    [key: string]: any;
}

class TibiaProtobuf {
    private proto!: string;
    private assets!: string;
    private static _instance: TibiaProtobuf;

    /**
     * TibiaProtobuf constructor.
     * 
     * @param assetsPath - The path to the assets file.
     * @param protoPath - The path to the protobuf file.
     */
    constructor(assetsPath: string, protoPath: string | null = null) {
        if (TibiaProtobuf._instance) {
            return TibiaProtobuf._instance;
        }

        this.proto = protoPath || path.join(__dirname, '..', 'resources', 'appearances.proto');
        this.assets = assetsPath;

        TibiaProtobuf._instance = this;
    }

    /**
     * Decodes the assets.
     * 
     * @returns The decoded appearance object.
     */
    async decode(): Promise<AppearanceObject> {
        const root = await protobuf.load(this.proto);
        const Appearances = root.lookupType('Appearances');
        const buffer = fs.readFileSync(this.assets);
        const message = Appearances.decode(buffer);
        
        const object = Appearances.toObject(message, {
            longs: String,
            enums: String,
            bytes: String,
            defaults: true
        });

        return object as AppearanceObject;
    }
}

export default TibiaProtobuf;
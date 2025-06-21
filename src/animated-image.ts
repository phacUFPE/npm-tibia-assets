import UPNG from 'upng-js';

export default class AnimatedImage {
    private width: number;
    private height: number;
    private delays: number[];
    private frames: ArrayBuffer[];
    private loop: number;

    /**
     * AnimatedImage constructor.
     * 
     * @param width - The width of the animated image.
     * @param height - The height of the animated image.
     * @param loop - The number of times the animation should loop. 0 means infinite loop.
     */
    constructor(width: number, height: number, loop: number = 0) {
        this.width = width;
        this.height = height;
        this.delays = [];
        this.frames = [];
        this.loop = loop;
    }

    /**
     * Adds a frame to the animated image.
     * 
     * @param frame - The frame to add.
     * @param delay - The delay for this frame in milliseconds.
     */
    addFrame(frame: ArrayBuffer, delay: number = 100): void {
        this.delays.push(delay);
        this.frames.push(frame);
    }

    /**
     * Creates the animated image as a PNG byte array.
     * 
     * @returns The animated image as a PNG byte array.
     */
    async create(): Promise<Uint8Array> {
        return UPNG.encode(this.frames, this.width, this.height, this.loop, this.delays);
    }

    /**
     * Gets the number of frames in the animated image.
     * 
     * @returns The number of frames in the animated image.
     */
    getFrameCount(): number {
        return this.frames.length;
    }

    /**
     * Clears all frames from the animated image.
     */
    clear(): void {
        this.frames = [];
    }
}

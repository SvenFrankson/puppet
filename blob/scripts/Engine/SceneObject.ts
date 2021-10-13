class SceneObject {

    public position: Vec2 = new Vec2();

    private _started: boolean;

    constructor(
        public name: string,
        public scene: Scene
    ) {

    }

    public start(): void {
        this._started = true;
    }

    public update(dt: number): void {
        if (!this._started) {
            this.start();
        }
    }

    public draw(context: CanvasRenderingContext2D): void {

    }
}
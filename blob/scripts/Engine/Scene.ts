class Scene {

    public objects: SceneObject[] = [];

    public context: CanvasRenderingContext2D;
    public canvasWidth: number;
    public canvasHeight: number;
    public clearColor: string = "#000000";

    public center: Vec2 = new Vec2();

    constructor(
        public main: Main,
        public canvas: HTMLCanvasElement
    ) {
        this.context = this.canvas.getContext("2d");
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
    }

    public update(dt: number): void {
        this.objects.forEach(o => {
            o.update(dt);
        });
    }

    public addObject(o: SceneObject): number {
        if (this.objects.indexOf(o) === -1) {
            this.objects.push(o);
            return 1;
        }
        return -1;
    }

    public removeObject(o: SceneObject): number {
        let i = this.objects.indexOf(o)
        if (i != -1) {
            this.objects.splice(i, 1);
            return 1;
        }
        return -1;
    }

    public draw(): void {
        this.context.fillStyle = this.clearColor;
        this.context.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.objects.forEach(o => {
            o.draw(this.context);
        });
    }

    public v2ToCanvasPos(v: Vec2): Vec2 {
        return new Vec2(
            this.canvasWidth * 0.5 + v.x,
            this.canvasHeight * 0.5 - v.y
        );
    }
}
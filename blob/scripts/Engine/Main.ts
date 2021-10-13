class Main {

    public scene: Scene;

    constructor() {
        let canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
        canvas.width = 512;
        canvas.height = 512;
        this.scene = new Scene(this, canvas);
        for (let i = 0; i < 30; i++) {
            this.scene.addObject(new Ball("ball-" + i.toFixed(0), this.scene));
        }
        let obs = new Ball("obs", this.scene);
        obs.r = 30;
        obs.fixed = true;
        this.scene.addObject(obs);
    }

    public start(): void {
        this.loop();
    }

    private _lastTime: number;
    public loop = () => {
        let dt = 1 / 60;
        let time = (new Date()).getTime();
        if (isFinite(this._lastTime)) {
            dt = (time - this._lastTime) / 1000;
        }
        this._lastTime = time;

        this.scene.update(dt);
        this.scene.draw();

        requestAnimationFrame(this.loop);
    }
}

window.onload = () => {
    let main = new Main();
    main.start();
}
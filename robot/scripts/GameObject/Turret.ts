class Turret extends GameObject {

    public isReady: boolean = true;

    public body: Sprite;
    public canon: Sprite;
    public top: Sprite;

    public target: Walker;

    public obstacle: Obstacle;

    public cooldown: number = 1;
    public counter: number = 0;

    constructor(
        main: Main
    ) {
        super(main);

        this.sprite = new Sprite("turret-base", "assets/turret_base.png", this.main.scene);
        this.sprite.height = 1;

        this.body = new Sprite("turret-body", "assets/turret_body.png", this.main.scene);
        this.body.height = 3;
        this.body.position.y = Sprite.LEVEL_STEP;
        this.body.parent = this.sprite;

        this.canon = new Sprite("turret-canon", "assets/turret_canon.png", this.main.scene);
        this.canon.height = 5;
        this.canon.posY = 0.6;
        this.canon.position.y = 2 * Sprite.LEVEL_STEP;
        this.canon.parent = this.body;

        this.top = new Sprite("turret-top", "assets/turret_top.png", this.main.scene);
        this.top.height = 5;
        this.top.position.y = 3 * Sprite.LEVEL_STEP;
        this.top.parent = this.body;

        this.setDarkness(0.5);
		
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }

    public dispose(): void {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.sprite.dispose();
        this.body.dispose();
        this.canon.dispose();
        this.top.dispose();
    }

    public makeReady(): void {
        this.isReady = true;
        this.setDarkness(1);
        if (!this.obstacle) {
            this.obstacle = Obstacle.CreateRect(this.sprite.posX, this.sprite.posY, 2.6, 2.6, 0);
            this.obstacle.shape.rotation2D = Math.PI / 4;
            NavGraphManager.AddObstacle(this.obstacle);
        }
    }

    private _t: number = 0;
    private _update = () => {
        if (!this.isReady) {
            return;
        }

        this._t += this.main.engine.getDeltaTime() / 1000;
        this.counter -= this.main.engine.getDeltaTime() / 1000;
        
        if (this.target && this.target.isDisposed) {
            this.target = undefined;
        }

        if (!this.target) {
            let walker = this.main.gameObjects.find(g => { return g instanceof Walker; }) as Walker;
            if (walker) {
                this.target = walker;
            }
        }

        if (this.target) {
            let dirToTarget = new BABYLON.Vector2(
                this.target.sprite.posX - this.sprite.posX,
                this.target.sprite.posY - this.sprite.posY
            );
            let targetA = - Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), dirToTarget);
            this.body.rotation.y = Math2D.StepFromToCirular(this.body.rotation.y, targetA, 1 / 10 * 2 *  Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000);
            let aligned = Math2D.AreEqualsCircular(this.body.rotation.y, targetA, Math.PI / 180);
            if (aligned) {
                if (this.counter < 0) {
                    this.target.wound(1);
                    this.counter = this.cooldown;
                    this._shoot();
                }
            }
        }
    }

    private async _shoot(): Promise<void> {
        return new Promise<void>(
            resolve => {
                let duration = 0.5;
                let t = 0;
                let bullets: BABYLON.Mesh[] = [];
                let bulletsCount: number = 5;
                let step = () => {
                    t += this.main.scene.getEngine().getDeltaTime() / 1000;
                    let d = t / duration;
                    d = Math.min(d, 1);
                    if (d < 1) {
                        this.canon.posY = 0.6 + 0.05 * Math.cos(7 * this._t * 2 * Math.PI);
                        this.body.posX = 0.03 * Math.cos(6 * this._t * 2 * Math.PI);
                        this.body.posY = 0.03 * Math.cos(8 * this._t * 2 * Math.PI);
                        
                        if (d * bulletsCount > bullets.length) {
                            let p0: BABYLON.Vector3 = this.canon.absolutePosition.clone();
                            p0.y = 1;
                            let p1: BABYLON.Vector2 = this.target.pos2D;
                            let bullet = BABYLON.MeshBuilder.CreateLines(
                                "bullet",
                                {
                                    points: [p0, new BABYLON.Vector3(p1.x, 1, p1.y)]
                                }
                            )
                            bullets.push(bullet);
                            setTimeout(
                                () => {
                                    bullet.dispose();
                                },
                                0.3
                            );
                        }

                        requestAnimationFrame(step);
                    }
                    else {
                        this.canon.posY = 0.6;
                        this.body.posX = 0;
                        this.body.posY = 0;
                        resolve();
                    }
                }
                step();
            }
        )
    }

    public setDarkness(d: number): void {
        this.sprite.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.body.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.canon.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.top.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
    }
}
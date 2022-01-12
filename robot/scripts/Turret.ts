class Turret extends GameObject {

    public base: Sprite;
    public body: Sprite;
    public canon: Sprite;
    public top: Sprite;

    public target: Walker;

    constructor(
        main: Main
    ) {
        super(main);

        this.base = new Sprite("turret-base", "assets/turret_base.png", this.main.scene);
        this.base.height = 1;

        this.body = new Sprite("turret-body", "assets/turret_body.png", this.main.scene);
        this.body.height = 3;
        this.body.position.z = - 0.1;
        this.body.parent = this.base;

        this.canon = new Sprite("turret-canon", "assets/turret_canon.png", this.main.scene);
        this.canon.height = 5;
        this.canon.position.y = 0.6;
        this.canon.position.z = - 0.1;
        this.canon.parent = this.body;

        this.top = new Sprite("turret-top", "assets/turret_top.png", this.main.scene);
        this.top.height = 5;
        this.top.position.z = - 0.2;
        this.top.parent = this.body;
		
        this.main.scene.onBeforeRenderObservable.add(this._update);
    }

    public dispose(): void {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.base.dispose();
        this.body.dispose();
        this.canon.dispose();
        this.top.dispose();
    }

    private _t: number = 0;
    private _update = () => {
        this._t += this.main.scene.getEngine().getDeltaTime() / 1000;
        
        if (this.target) {
            let dirToTarget = new BABYLON.Vector2(
                this.target.body.position.x - this.base.position.x,
                this.target.body.position.y - this.base.position.y
            );
            let targetA = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), dirToTarget);
            this.body.rotation.z = Math2D.StepFromToCirular(this.body.rotation.z, targetA, 1 / 30 * 2 *  Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000);
            let aligned = Math2D.AreEqualsCircular(this.body.rotation.z, targetA, Math.PI / 180);
            if (aligned) {
                this.canon.position.y = 0.6 + 0.05 * Math.cos(7 * this._t * 2 * Math.PI);
                this.body.position.x = 0.03 * Math.cos(6 * this._t * 2 * Math.PI);
                this.body.position.y = 0.03 * Math.cos(8 * this._t * 2 * Math.PI);
            }
            else {
                this.canon.position.y = 0.6;
                this.body.position.x = 0;
                this.body.position.y = 0;
            }
        }

    }
}
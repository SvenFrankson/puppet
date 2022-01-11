class Turret {

    public base: Sprite;
    public body: Sprite;
    public canon: Sprite;
    public top: Sprite;

    public target: Walker;

    constructor(
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        
        this.base = new Sprite("turret-base", "assets/turret_base.png", this.scene);
        this.base.height = 1;

        this.body = new Sprite("turret-body", "assets/turret_body.png", this.scene);
        this.body.height = 3;
        this.body.position.z = - 0.1;
        this.body.parent = this.base;

        this.canon = new Sprite("turret-canon", "assets/turret_canon.png", this.scene);
        this.canon.height = 5;
        this.canon.position.y = 0.6;
        this.canon.position.z = - 0.1;
        this.canon.parent = this.body;

        this.top = new Sprite("turret-top", "assets/turret_top.png", this.scene);
        this.top.height = 5;
        this.top.position.z = - 0.2;
        this.top.parent = this.body;
		
        this.scene.onBeforeRenderObservable.add(this._update);
    }

    private _t: number = 0;
    private _update = () => {
        this._t += this.scene.getEngine().getDeltaTime() / 1000;
        
        if (this.target) {
            let dirToTarget = new BABYLON.Vector2(
                this.target.body.position.x - this.base.position.x,
                this.target.body.position.y - this.base.position.y
            );
            let targetA = Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), dirToTarget);
            this.body.rotation.z = Math2D.StepFromToCirular(this.body.rotation.z, targetA, 1 / 30 * 2 *  Math.PI * this.scene.getEngine().getDeltaTime() / 1000);
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
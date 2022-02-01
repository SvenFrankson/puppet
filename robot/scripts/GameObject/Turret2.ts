class Canon extends Building {

    public body: BABYLON.Mesh;
    public head: BABYLON.Mesh;
    public canon: BABYLON.Mesh;

    public flashParticle: FlashParticle;

    public target: Robot;

    public cooldown: number = 1;
    public counter: number = 0;

    constructor(main: Main) {
        super(main);

        this.counter = Math.random() * this.cooldown;
    }

    public async instantiate(): Promise<void> {
        return new Promise<void>(
            resolve => {
                BABYLON.SceneLoader.ImportMesh(
                    "",
                    "assets/canon.babylon",
                    "",
                    this.main.scene,
                    (meshes) => {
                        let p = this.base.position;
                        this.base = meshes.find(m => { return m.name === "base"; }) as BABYLON.Mesh;
                        this.base.position.copyFrom(p);
                        this.body = meshes.find(m => { return m.name === "body"; }) as BABYLON.Mesh;
                        this.head = meshes.find(m => { return m.name === "head"; }) as BABYLON.Mesh;
                        this.canon = meshes.find(m => { return m.name === "canon"; }) as BABYLON.Mesh;
                        
                        for (let i = 0; i < meshes.length; i++) {
                            let mesh = meshes[i];
                            if (mesh.material instanceof BABYLON.PBRMaterial) {
                                let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                                if (mesh.material.name === "CanonMaterial") {
                                    toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/canon-texture-dark.png", this.main.scene));
                                }
                                toonMaterial.setColor(mesh.material.albedoColor);
                                mesh.material = toonMaterial;
                            }
                        }
        
                        this.flashParticle = new FlashParticle("pew", this.main.scene, 1.5, 0.1);
        
                        this.main.scene.onBeforeRenderObservable.add(this._update);
                        this.isInstantiated = true;
                        resolve();
                    }
                );
            }
        );
    }
    
    private _t: number = 0;
    private _update = () => {
        this._updateTarget();
        this._updateMesh();

        this._t += this.main.engine.getDeltaTime() / 1000;
        this.counter -= this.main.engine.getDeltaTime() / 1000;
        
        if (this.counter < 0) {
            this.counter = this.cooldown;
            this._shoot();
        }
    }

    private _updateTarget(): void{
        if (!this.target || this.target.isDisposed) {
            this.target = this.main.gameObjects.find(g => { return g instanceof Robot; }) as Robot;
        }
    }

    private async _shoot(): Promise<void> {
        return new Promise<void>(
            resolve => {
                this.flashParticle.flash(this.canon.absolutePosition.add(this.canon.forward.scale(3.5)), this.canon.forward);

                let duration = 0.2;
                let t = 0;
                let step = () => {
                    t += this.main.scene.getEngine().getDeltaTime() / 1000;
                    let d = t / duration;
                    d = Math.min(d, 1);
                    if (d < 1) {
                        if (d < 0.1) {
                            this.canon.position.z = - 0.5 * d / 0.1;
                            this.head.position.z = - 0.2 * d / 0.1;
                        }
                        else {
                            let dd = (d - 0.1) / (1 - 0.1);
                            this.canon.position.z = - 0.5 * (1 - dd);
                            this.head.position.z = - 0.2 * (1 - dd);
                        }
                        requestAnimationFrame(step);
                    }
                    else {                      
                        resolve();
                    }
                }
                step();
            }
        )
    }

    private _updateMesh(): void {
        if (this.target && !this.target.isDisposed) {
            let a = BABYLON.Vector3.GetAngleBetweenVectors(BABYLON.Axis.Z, this.target.body.position.subtract(this.body.absolutePosition), BABYLON.Axis.Y);
            this.body.rotation.y = a;

            let b = BABYLON.Vector3.GetAngleBetweenVectors(this.body.forward, this.target.body.position.subtract(this.head.absolutePosition), this.body.right);
            this.head.rotation.x = b;
        }
    }
}
class Turret2 extends GameObject {

    public get pos2D(): BABYLON.Vector2 {
        if (!this._pos2D) {
            this._pos2D = BABYLON.Vector2.Zero();
        }
        this._pos2D.x = this.base.position.x;
        this._pos2D.y = this.base.position.z;

        return this._pos2D;
    }

    public get posX(): number {
        return this.base.position.x;
    }
    public set posX(x: number) {
        this.base.position.x = x;
    }

    public get posY(): number {
        return this.base.position.z;
    }
    public set posY(y: number) {
        this.base.position.z = y;
    }

    public base: BABYLON.Mesh;
    public body: BABYLON.Mesh;
    public head: BABYLON.Mesh;
    public canon: BABYLON.Mesh;

    public target: Robot;

    public cooldown: number = 1;
    public counter: number = 0;

    constructor(pos2D: BABYLON.Vector2, main: Main) {
        super(main);

        this.counter = Math.random() * this.cooldown;
        
        BABYLON.SceneLoader.ImportMesh(
			"",
			"assets/canon.babylon",
			"",
			this.main.scene,
			(meshes) => {
                this.base = meshes.find(m => { return m.name === "base"; }) as BABYLON.Mesh;
                this.body = meshes.find(m => { return m.name === "body"; }) as BABYLON.Mesh;
                this.head = meshes.find(m => { return m.name === "head"; }) as BABYLON.Mesh;
                this.canon = meshes.find(m => { return m.name === "canon"; }) as BABYLON.Mesh;

                console.log(this.base);
                console.log(this.body);
                console.log(this.head);
                console.log(this.canon);
                
				for (let i = 0; i < meshes.length; i++) {
					let mesh = meshes[i];
                    if (mesh.material instanceof BABYLON.PBRMaterial) {
                        let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                        if (mesh.material.name === "CanonMaterial") {
                            toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/canon-texture-blue.png", this.main.scene));
                        }
                        toonMaterial.setColor(mesh.material.albedoColor);
                        mesh.material = toonMaterial;
                    }
				}

                this.posX = pos2D.x;
                this.posY = pos2D.y;
                this.base.position.y = this.main.ground.getHeightAt(this.pos2D);

                this.main.scene.onBeforeRenderObservable.add(this._update);
			}
		)
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
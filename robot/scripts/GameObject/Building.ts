/// <reference path="GameObject.ts"/>

abstract class Building extends GameObject {

    public isReady: boolean;

    public base: BABYLON.Mesh;
    public obstacle: Obstacle;
    
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

    constructor(main: Main) {
        super(main);
        this.base = new BABYLON.Mesh("building", this.main.scene);
    }

    public makeReady(): void {
        this.isReady = true;
    }
}

class CommandCenter extends Building {

    constructor(main: Main) {
        super(main);
        BABYLON.SceneLoader.ImportMesh(
			"",
			"assets/command-center.babylon",
			"",
			this.main.scene,
			(meshes) => {
				for (let i = 0; i < meshes.length; i++) {
					let mesh = meshes[i];
					mesh.parent = this.base;
                    if (mesh instanceof BABYLON.Mesh) {
                        mesh.instances.forEach(
                            (instancedMesh) => {
                                instancedMesh.parent = this.base;
                            }
                        )
                    }
				}
			}
		)
    }

    public makeReady(): void {
        super.makeReady();
        if (!this.obstacle) {
            this.obstacle = Obstacle.CreateHexagon(this.posX, this.posY, 3);
            NavGraphManager.AddObstacle(this.obstacle);
        }
    }
}

class Beacon extends Building {

    private _t: number = Infinity;

    constructor(main: Main) {
        super(main);
        BABYLON.SceneLoader.ImportMesh(
			"",
			"assets/beacon.babylon",
			"",
			this.main.scene,
			(meshes) => {
				for (let i = 0; i < meshes.length; i++) {
					let mesh = meshes[i];
					mesh.parent = this.base;
                    if (mesh instanceof BABYLON.Mesh) {
                        mesh.instances.forEach(
                            (instancedMesh) => {
                                instancedMesh.parent = this.base;
                            }
                        )
                    }
				}
			}
		);

        this.main.scene.onBeforeRenderObservable.add(this._update);
    }

    public _update = () => {
        this._t += this.main.engine.getDeltaTime() / 1000;
        if (this._t > 15) {
            this._t = 0;
            let walker = new Walker(this.main);
            walker.target.posX = this.posX;
            walker.target.posY = this.posY;
        }
    }

    public dispose(): void {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
    }

    public makeReady(): void {
        super.makeReady();
        if (!this.obstacle) {
            this.obstacle = Obstacle.CreateRect(this.posX, this.posY, 1.5, 1.5);
            NavGraphManager.AddObstacle(this.obstacle);
        }
    }
}
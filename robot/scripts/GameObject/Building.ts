/// <reference path="GameObject.ts"/>

abstract class Building extends GameObject {

    public isReady: boolean;

    public base: BABYLON.Mesh;
    public obstacle: Obstacle;
    
    public get pos2D(): BABYLON.Vector2 {
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
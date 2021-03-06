class TerrainToonMaterial extends BABYLON.ShaderMaterial {

    constructor(name: string, color: BABYLON.Color3, scene: BABYLON.Scene) {
        super(
            name,
            scene,
            {
                vertex: "terrainToon",
                fragment: "terrainToon",
            },
            {
                attributes: ["position", "normal", "uv", "color"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
            }
        );
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(0.5 + Math.random(), 2.5 + Math.random(), 1.5 + Math.random())).normalize());
        this.setColor3("colGrass", BABYLON.Color3.FromHexString("#47a632"));
        this.setColor3("colDirt", BABYLON.Color3.FromHexString("#a86f32"));
        this.setColor3("colRock", BABYLON.Color3.FromHexString("#8c8c89"));
        this.setColor3("colSand", BABYLON.Color3.FromHexString("#dbc67b"));
    }
}

class TerrainTileToonMaterial extends BABYLON.ShaderMaterial {

    constructor(name: string, scene: BABYLON.Scene) {
        super(
            name,
            scene,
            {
                vertex: "terrainTileToon",
                fragment: "terrainTileToon",
            },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
            }
        );
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(0.5, 2.5, 1.5)).normalize());
    }

    private _diffuseTexture: BABYLON.Texture;
    public get diffuseTexture(): BABYLON.Texture {
        return this._diffuseTexture;
    }
    public set diffuseTexture(tex: BABYLON.Texture) {
        this._diffuseTexture = tex;
        this.setTexture("diffuseTexture", this._diffuseTexture);
    }
}

class ToonMaterial extends BABYLON.ShaderMaterial {

    constructor(name: string, transparent: boolean, scene: BABYLON.Scene) {
        super(
            name,
            scene,
            {
                vertex: "toon",
                fragment: "toon",
            },
            {
                attributes: ["position", "normal", "uv", "color"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
                needAlphaBlending: true
            }
        );
        this.setTexture("pencil_texture", new BABYLON.Texture("assets/pencil.png", this.getScene()));
    }
}
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
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
                samplers: ["colorTexture"]
            }
        );
        this.setTexture("colorTexture", new BABYLON.Texture("assets/empty.png", scene));
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(- 1, 1, - 1)).normalize());
    }

    public setColor(color: BABYLON.Color3): void {
        this.setColor3("mColor", color);
    }
}

class TerrainMaterial extends BABYLON.ShaderMaterial {
    constructor(name: string, transparent: boolean, scene: BABYLON.Scene) {
        super(
            name,
            scene,
            {
                vertex: "terrain-toon",
                fragment: "terrain-toon",
            },
            {
                attributes: ["position", "normal", "uv", "color"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
                samplers: ["colorTexture"]
            }
        );
        this.setTexture("colorTexture", new BABYLON.Texture("assets/empty.png", scene));
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(- 1, 1, - 1)).normalize());
    }
}
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
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "vColorW", "vColorR", "vColorG", "vColorB", "vColorU"],
                samplers: ["colorTexture"]
            }
        );
        this.setTexture("colorTexture", new BABYLON.Texture("assets/empty.png", scene));
        this.setVector3("lightInvDirW", (new BABYLON.Vector3(- 1, 1, - 1)).normalize());
        this.setColor4("vColorW", new BABYLON.Color4(1, 1, 1, 1));
        this.setColor4("vColorR", new BABYLON.Color4(95 / 255, 16 / 255, 10 / 255, 1));
        this.setColor4("vColorG", new BABYLON.Color4(144 / 255, 24 / 255, 11 / 255, 1));
        this.setColor4("vColorB", new BABYLON.Color4(211 / 255, 113 / 255, 63 / 255, 1));
        this.setColor4("vColorU", new BABYLON.Color4(30 / 255, 30 / 255, 30 / 255, 1));
    }
}
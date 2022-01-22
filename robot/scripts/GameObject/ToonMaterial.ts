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
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "mColor"],
                needAlphaBlending: true
            }
        );
    }

    public setColor(color: BABYLON.Color3): void {
        this.setColor3("mColor", color);
    }
}
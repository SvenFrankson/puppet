class SpriteUtils {

    public static MakeShadow(sprite: BABYLON.Mesh, w: number, h: number): BABYLON.Mesh {
        let shadowSprite = BABYLON.MeshBuilder.CreatePlane(sprite.name + "-shadow", { width: w, height: h }, sprite.getScene());
        shadowSprite.position.z = 1;

		let shadowSpriteMaterial = new BABYLON.StandardMaterial(sprite.material.name + "-shadow", sprite.getScene());
        let spriteMaterial = sprite.material as BABYLON.StandardMaterial;
		shadowSpriteMaterial.diffuseTexture = spriteMaterial.diffuseTexture;
        shadowSpriteMaterial.diffuseColor.copyFromFloats(0, 0, 0);
		shadowSpriteMaterial.diffuseTexture.hasAlpha = true;
        shadowSpriteMaterial.specularColor.copyFromFloats(0, 0, 0);
		shadowSpriteMaterial.alphaCutOff = 0.1

		shadowSprite.material = shadowSpriteMaterial;

        return shadowSprite;
    }
}
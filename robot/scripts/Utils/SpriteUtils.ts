class SpriteUtils {

    public static MakeShadow(sprite: BABYLON.Mesh, w: number, h: number): BABYLON.Mesh {
        let shadowSprite = new BABYLON.Mesh(sprite.name + "-shadow", sprite.getScene());
        SpriteUtils.CreatePlaneData(w, h).applyToMesh(shadowSprite);
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

    public static CreatePlaneData(w: number, h: number, inputUvs?: BABYLON.Vector4): BABYLON.VertexData {
        let data = new BABYLON.VertexData();
            
        let positions: number[] = [];
        let indices: number[] = [];
        let uvs: number[] = [];

        let ww = 0.5 * w;
        let hh = 0.5 * h;

        positions.push(
            - ww, 0, - hh,
            - ww, 0, hh,
            ww, 0, hh,
            ww, 0, - hh
        );

        indices.push(
            0, 2, 1,
            0, 3, 2
        );

        if (!inputUvs) {
            uvs.push(
                0, 0,
                0, 1,
                1, 1,
                1, 0
            );
        }
        else {
            uvs.push(
                inputUvs.x, inputUvs.y,
                inputUvs.x, inputUvs.w,
                inputUvs.z, inputUvs.w,
                inputUvs.z, inputUvs.y
            );
        }

        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;

        return data;
    }
}
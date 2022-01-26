class Robot extends GameObject {

    constructor(main: Main) {
        super(main);
        BABYLON.SceneLoader.ImportMesh(
			"",
			"assets/robot.babylon",
			"",
			this.main.scene,
			(meshes) => {
				for (let i = 0; i < meshes.length; i++) {
					let mesh = meshes[i];
                    if (mesh.material instanceof BABYLON.PBRMaterial) {
                        console.log(mesh.material);
                        let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                        if (mesh.material.name === "RobotMaterial") {
                            toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/robot-texture.png", this.main.scene));
                        }
                        toonMaterial.setColor(mesh.material.albedoColor);
                        mesh.material = toonMaterial;
                    }
				}
			}
		)
    }
}
class Robot extends GameObject {

    public head: BABYLON.Mesh;
    public body: BABYLON.Mesh;
    public feet: BABYLON.Mesh[];
    public legs: BABYLON.Mesh[];
    public upperLegs: BABYLON.Mesh[];
    public upperLegsRoot: BABYLON.Mesh[];
    public hands: BABYLON.Mesh[];
    public arms: BABYLON.Mesh[];
    public upperArms: BABYLON.Mesh[];
    public upperArmsRoot: BABYLON.Mesh[];

    constructor(main: Main) {
        super(main);
        BABYLON.SceneLoader.ImportMesh(
			"",
			"assets/robot.babylon",
			"",
			this.main.scene,
			(meshes) => {
                this.head = meshes.find(m => { return m.name === "head"; }) as BABYLON.Mesh;
                this.body = meshes.find(m => { return m.name === "body"; }) as BABYLON.Mesh;
                this.feet = [
                    meshes.find(m => { return m.name === "foot-right"; }) as BABYLON.Mesh,
                    meshes.find(m => { return m.name === "foot-left"; }) as BABYLON.Mesh
                ];
                this.legs = [
                    meshes.find(m => { return m.name === "leg-right"; }) as BABYLON.Mesh,
                    meshes.find(m => { return m.name === "leg-left"; }) as BABYLON.Mesh
                ];
                this.upperLegs = [
                    meshes.find(m => { return m.name === "upper-leg-right"; }) as BABYLON.Mesh,
                    meshes.find(m => { return m.name === "upper-leg-left"; }) as BABYLON.Mesh
                ];
                this.upperLegsRoot = [
                    new BABYLON.Mesh("upper-leg-root-0"),
                    new BABYLON.Mesh("upper-leg-root-1"),
                ];
                this.upperLegsRoot[0].position.copyFrom(this.upperLegs[0].position);
                this.upperLegsRoot[0].parent = this.body;
                this.upperLegsRoot[1].position.copyFrom(this.upperLegs[1].position);
                this.upperLegsRoot[1].parent = this.body;
                this.upperLegs[0].parent = undefined;
                this.upperLegs[1].parent = undefined;

                this.hands = [
                    meshes.find(m => { return m.name === "hand-right"; }) as BABYLON.Mesh,
                    meshes.find(m => { return m.name === "hand-left"; }) as BABYLON.Mesh
                ];
                this.arms = [
                    meshes.find(m => { return m.name === "arm-right"; }) as BABYLON.Mesh,
                    meshes.find(m => { return m.name === "arm-left"; }) as BABYLON.Mesh
                ];
                this.upperArms = [
                    meshes.find(m => { return m.name === "upper-arm-right"; }) as BABYLON.Mesh,
                    meshes.find(m => { return m.name === "upper-arm-left"; }) as BABYLON.Mesh
                ];
                this.upperArmsRoot = [
                    new BABYLON.Mesh("upper-arm-root-0"),
                    new BABYLON.Mesh("upper-arm-root-1"),
                ];
                this.upperArmsRoot[0].position.copyFrom(this.upperArms[0].position);
                this.upperArmsRoot[0].parent = this.body;
                this.upperArmsRoot[1].position.copyFrom(this.upperArms[1].position);
                this.upperArmsRoot[1].parent = this.body;
                this.upperArms[0].parent = undefined;
                this.upperArms[1].parent = undefined;


                setInterval(
                    () => {
                        this.upperArms[0].position.copyFrom(this.upperArmsRoot[0].absolutePosition);
                        this.upperArms[0].lookAt(this.arms[0].absolutePosition);

                        this.upperArms[1].position.copyFrom(this.upperArmsRoot[1].absolutePosition);
                        this.upperArms[1].lookAt(this.arms[1].absolutePosition);
                        
                        this.arms[0].lookAt(this.hands[0].absolutePosition);
                        this.arms[1].lookAt(this.hands[1].absolutePosition);

                        this.upperLegs[0].position.copyFrom(this.upperLegsRoot[0].absolutePosition);
                        this.upperLegs[0].lookAt(this.legs[0].absolutePosition);

                        this.upperLegs[1].position.copyFrom(this.upperLegsRoot[1].absolutePosition);
                        this.upperLegs[1].lookAt(this.legs[1].absolutePosition);

                        this.legs[0].lookAt(this.feet[0].absolutePosition);
                        this.legs[1].lookAt(this.feet[1].absolutePosition);
                    },
                    100
                );

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
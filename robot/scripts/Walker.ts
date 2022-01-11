class WalkerTarget extends BABYLON.Mesh {

    public targets: BABYLON.Mesh[] = [];

    constructor(
        public walker: Walker
    ) {
        super("target");

        let positions: BABYLON.Vector2[] = [
            new BABYLON.Vector2(- 1, 0),
            new BABYLON.Vector2(1, 0)
        ]
        for (let i = 0; i < walker.legCount; i++) {
            //let target = new BABYLON.Mesh("target-" + i);
            let target = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            let red = new BABYLON.StandardMaterial("red", this.walker.scene);
            red.diffuseColor.copyFromFloats(1, 0, 0);
            red.specularColor.copyFromFloats(0, 0, 0);
            target.material = red;
            target.position.x = positions[i].x;
            target.position.y = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
        }
    }
}

class Walker {

    public legCount: number = 2;

    public feet: BABYLON.Mesh[] = [];
    public arms: BABYLON.Mesh[] = [];
    public body: BABYLON.Mesh;

    public target: WalkerTarget;
    private _inputDirs: UniqueList<number> = new UniqueList<number>();
    private get _inputDir(): number {
        return this._inputDirs.getLast();
    }

    constructor(
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        this.target = new WalkerTarget(this);

        let robotBody = BABYLON.MeshBuilder.CreatePlane("robot-body-2", { width: 1.80, height: 3.06 }, this.scene);
		robotBody.position.x = 5;
		robotBody.position.y = 5;

		let robotBodyMaterial = new BABYLON.StandardMaterial("robot-body-material", this.scene);
		robotBodyMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_body_2.png", this.scene);
		robotBodyMaterial.diffuseTexture.hasAlpha = true;
        robotBodyMaterial.specularColor.copyFromFloats(0, 0, 0);
		robotBodyMaterial.alphaCutOff = 0.1

		robotBody.material = robotBodyMaterial;

        let robotBodyShadow = SpriteUtils.MakeShadow(robotBody, 1.80, 3.06);
        robotBodyShadow.position.z = 1.1;
        this.scene.onBeforeRenderObservable.add(() => {
            robotBodyShadow.position.x = robotBody.absolutePosition.x + 0.2;
            robotBodyShadow.position.y = robotBody.absolutePosition.y - 0.1;
            robotBodyShadow.rotation.z = robotBody.rotation.z;
        });

        this.body = robotBody;
		
		let robotArm_L = BABYLON.MeshBuilder.CreatePlane("robot-arm_L", { width: 1.38, height: 1.31 }, this.scene);
		robotArm_L.setPivotPoint((new BABYLON.Vector3(0.48, - 0.43, 0)));
		robotArm_L.position.x = - 1.1;
		robotArm_L.position.y = 0.7;
		robotArm_L.position.z = - 0.1;
		robotArm_L.parent = robotBody

		let robotArm_LMaterial = new BABYLON.StandardMaterial("robot-arm_L-material", this.scene);
		robotArm_LMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_arm_L.png", this.scene);
		robotArm_LMaterial.diffuseTexture.hasAlpha = true;
        robotArm_LMaterial.specularColor.copyFromFloats(0, 0, 0);
		robotArm_LMaterial.alphaCutOff = 0.1

		robotArm_L.material = robotArm_LMaterial;

        let robotArm_LShadow = SpriteUtils.MakeShadow(robotArm_L, 1.38, 1.31);
        robotArm_LShadow.position.z = 1.1;
        this.scene.onBeforeRenderObservable.add(() => {
            robotArm_LShadow.position.x = robotArm_L.absolutePosition.x + 0.2;
            robotArm_LShadow.position.y = robotArm_L.absolutePosition.y - 0.1;
            robotArm_LShadow.rotation.z = robotArm_L.rotation.z;
        });

		let robotArm_R = BABYLON.MeshBuilder.CreatePlane("robot-arm_R", { width: 1.34, height: 1.28 }, this.scene);
		robotArm_R.setPivotPoint((new BABYLON.Vector3(- 0.47, - 0.44, 0)));
		robotArm_R.position.x = 1.1;
		robotArm_R.position.y = 0.7;
		robotArm_R.position.z = - 0.1;
		robotArm_R.parent = robotBody

		let robotArm_RMaterial = new BABYLON.StandardMaterial("robot-arm_R-material", this.scene);
		robotArm_RMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_arm_R.png", this.scene);
		robotArm_RMaterial.diffuseTexture.hasAlpha = true;
        robotArm_RMaterial.specularColor.copyFromFloats(0, 0, 0);
		robotArm_RMaterial.alphaCutOff = 0.1

		robotArm_R.material = robotArm_RMaterial;

        let robotArm_RShadow = SpriteUtils.MakeShadow(robotArm_R, 1.34, 1.28);
        robotArm_RShadow.position.z = 1.1;
        this.scene.onBeforeRenderObservable.add(() => {
            robotArm_RShadow.position.x = robotArm_R.absolutePosition.x + 0.2;
            robotArm_RShadow.position.y = robotArm_R.absolutePosition.y - 0.1;
            robotArm_RShadow.rotation.z = robotArm_R.rotation.z;
        });

        let robotFoot_L = BABYLON.MeshBuilder.CreatePlane("robot-foot_L", { width: 1.60, height: 1.78 }, this.scene);
		robotFoot_L.position.x = - 1.1;
		robotFoot_L.position.y = 0;
		robotFoot_L.position.z = 0.1;
		robotFoot_L.rotation.z = 0.3;

		let robotfoot_LMaterial = new BABYLON.StandardMaterial("robot-foot_L-material", this.scene);
		robotfoot_LMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_foot_L.png", this.scene);
		robotfoot_LMaterial.diffuseTexture.hasAlpha = true;
        robotfoot_LMaterial.specularColor.copyFromFloats(0, 0, 0);
		robotfoot_LMaterial.alphaCutOff = 0.1

		robotFoot_L.material = robotfoot_LMaterial;

        let robotFoot_LShadow = SpriteUtils.MakeShadow(robotFoot_L, 1.60, 1.78);
        robotFoot_LShadow.position.z = 1.1;
        this.scene.onBeforeRenderObservable.add(() => {
            robotFoot_LShadow.position.x = robotFoot_L.absolutePosition.x + 0.2;
            robotFoot_LShadow.position.y = robotFoot_L.absolutePosition.y - 0.1;
            robotFoot_LShadow.rotation.z = robotFoot_L.rotation.z;
        });

		let robotFoot_R = BABYLON.MeshBuilder.CreatePlane("robot-foot_R", { width: 1.57, height: 1.76 }, this.scene);
		robotFoot_R.position.x = 1.1;
		robotFoot_R.position.y = 0;
		robotFoot_R.position.z = 0.1;
		robotFoot_R.rotation.z = - 0.3;

		let robotfoot_RMaterial = new BABYLON.StandardMaterial("robot-foot_R-material", this.scene);
		robotfoot_RMaterial.diffuseTexture = new BABYLON.Texture("assets/robot_foot_R.png", this.scene);
		robotfoot_RMaterial.diffuseTexture.hasAlpha = true;
        robotfoot_RMaterial.specularColor.copyFromFloats(0, 0, 0);
		robotfoot_RMaterial.alphaCutOff = 0.1

		robotFoot_R.material = robotfoot_RMaterial;

        let robotFoot_RShadow = SpriteUtils.MakeShadow(robotFoot_R, 1.57, 1.76);
        robotFoot_RShadow.position.z = 1.1;
        this.scene.onBeforeRenderObservable.add(() => {
            robotFoot_RShadow.position.x = robotFoot_R.absolutePosition.x + 0.2;
            robotFoot_RShadow.position.y = robotFoot_R.absolutePosition.y - 0.1;
            robotFoot_RShadow.rotation.z = robotFoot_R.rotation.z;
        });

        this.feet = [robotFoot_L, robotFoot_R];
        this.arms = [robotArm_L, robotArm_R];

        this.scene.onBeforeRenderObservable.add(this._update);

        this.canvas.addEventListener("keydown", (e) => {
            if (e.code === "KeyD") {
                this._inputDirs.push(0);
            }
            if (e.code === "KeyS") {
                this._inputDirs.push(1);
            }
            if (e.code === "KeyA") {
                this._inputDirs.push(2);
            }
            if (e.code === "KeyW") {
                this._inputDirs.push(3);
            }
            if (e.code === "KeyQ") {
                this._inputDirs.push(4);
            }
            if (e.code === "KeyE") {
                this._inputDirs.push(5);
            }
        });

        this.canvas.addEventListener("keyup", (e) => {
            if (e.code === "KeyD") {
                this._inputDirs.remove(0);
            }
            if (e.code === "KeyS") {
                this._inputDirs.remove(1);
            }
            if (e.code === "KeyA") {
                this._inputDirs.remove(2);
            }
            if (e.code === "KeyW") {
                this._inputDirs.remove(3);
            }
            if (e.code === "KeyQ") {
                this._inputDirs.remove(4);
            }
            if (e.code === "KeyE") {
                this._inputDirs.remove(5);
            }
        });
    }

    private _movingLegCount: number = 0;
    private _movingLegs: UniqueList<number> = new UniqueList<number>();

    private async _moveLeg(legIndex: number, target: BABYLON.Vector3, targetR: number): Promise<void> {
        return new Promise<void>(
            resolve => {
                this._movingLegs.push(legIndex);
                let origin = this.feet[legIndex].position.clone();
                let originR = this.feet[legIndex].rotation.z;
                let l = target.subtract(origin).length();
                let duration = Math.floor(l / 3);
                duration *= 0.5;
                duration += 0.5;
                let t = 0;
                let step = () => {
                    t += this.scene.getEngine().getDeltaTime() / 1000;
                    let d = t / duration;
                    d = d * d;
                    d = Math.min(d, 1);
                    this.feet[legIndex].position.copyFrom(
                        origin.scale(1 - d).add(target.scale(d))
                    );
                    this.feet[legIndex].position.z = 0.1;
                    this.feet[legIndex].rotation.z = Math2D.LerpFromToCircular(originR, targetR, d);
                    if (d < 1) {
                        requestAnimationFrame(step);
                    }
                    else {
                        this._movingLegCount -= 1;
                        this._movingLegs.remove(legIndex);
                        resolve();
                    }
                }
                step();
            }
        )
    }

    private _bodyT: number = 0;
    private _bodySpeed: number = 0.5;
    private _armT: number = 0;
    private _armSpeed: number = 1;
    private _update = () => {
        this._bodyT += this._bodySpeed * this.scene.getEngine().getDeltaTime() / 1000;
        this._armT += this._armSpeed * this.scene.getEngine().getDeltaTime() / 1000;
        this._bodySpeed = 1;
        this._armSpeed = 1;
        if (this._inputDirs.contains(0)) {
            this.target.position.addInPlace(this.target.right.scale(2 * this.scene.getEngine().getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(1)) {
            this.target.position.subtractInPlace(this.target.up.scale(1 * this.scene.getEngine().getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(2)) {
            this.target.position.subtractInPlace(this.target.right.scale(2 * this.scene.getEngine().getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(3)) {
            this.target.position.addInPlace(this.target.up.scale(3 * this.scene.getEngine().getDeltaTime() / 1000));
            this._bodySpeed = 3;
            this._armSpeed = 5;
        }
        if (this._inputDirs.contains(4)) {
            this.target.rotation.z += 0.4 * Math.PI * this.scene.getEngine().getDeltaTime() / 1000;
        }
        if (this._inputDirs.contains(5)) {
            this.target.rotation.z -= 0.4 * Math.PI * this.scene.getEngine().getDeltaTime() / 1000;
        }
        while (this.target.rotation.z < 0) {
            this.target.rotation.z += 2 * Math.PI;
        }
        while (this.target.rotation.z >= 2 * Math.PI) {
            this.target.rotation.z -= 2 * Math.PI;
        }

        this.body.position.copyFrom(this.feet[0].position);
        for (let i = 1; i < this.legCount; i++) {
            this.body.position.addInPlace(this.feet[i].position);
        }
        this.body.position.scaleInPlace(1 / this.legCount);
        this.body.position.x += Math.cos(1 * this._bodyT * Math.PI) * 0.1;
        this.body.position.y += Math.cos(1.1 * this._bodyT * Math.PI) * 0.1;
        this.body.position.z = 0;

        this.arms[0].rotation.z = Math.cos(1 * this._armT * Math.PI) * 0.15 - 0.3;
        this.arms[1].rotation.z = Math.cos(1.1 * this._armT * Math.PI) * 0.15 + 0.3;
        
        let rightDir = new BABYLON.Vector2(
            this.feet[1].absolutePosition.x - this.feet[0].absolutePosition.x,
            this.feet[1].absolutePosition.y - this.feet[0].absolutePosition.y,
        )
        rightDir.normalize();

        let a = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), rightDir);
        this.body.rotation.z = Math2D.LerpFromToCircular(a, this.target.rotation.z, 0.5);

        if (this._movingLegCount <= 0) {
            let index = - 1;
            let dist = 0;
            for (let i = 0; i < this.legCount; i++) {
                if (!this._movingLegs.contains(i)) {
                    let iDist = BABYLON.Vector3.DistanceSquared(this.feet[i].position, this.target.targets[i].absolutePosition);
                    if (iDist > dist) {
                        dist = iDist;
                        index = i;
                    }
                }
            }
            if (dist > 0.01) {
                this._movingLegCount++;
                this._moveLeg(index, this.target.targets[index].absolutePosition, this.target.rotation.z); 
            }
        }
    }
}
class RobotTarget extends BABYLON.Mesh {

    private _pos2D: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    public get pos2D(): BABYLON.Vector2 {
        this._pos2D.x = this.position.x;
        this._pos2D.y = this.position.z;

        return this._pos2D;
    }

    public get posX(): number {
        return this.position.x;
    }

    public set posX(x: number) {
        this.position.x = x;
    }

    public get posY(): number {
        return this.position.z;
    }

    public set posY(y: number) {
        this.position.z = y;
    }

    public get rot(): number {
        return this.rotation.y;
    }
    public set rot(r: number) {
        this.rotation.y = r;
    }

    public targets: BABYLON.Mesh[] = [];

    constructor(
        public robot: Robot
    ) {
        super("target");

        let positions: BABYLON.Vector2[] = [
            new BABYLON.Vector2(1, 0),
            new BABYLON.Vector2(- 1, 0)
        ]
        for (let i = 0; i < 2; i++) {
            let target = new BABYLON.Mesh("target-" + i);
            target.position.x = positions[i].x;
            target.position.z = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
        }
    }
}

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

    public target: RobotTarget;
    private _inputDirs: UniqueList<number> = new UniqueList<number>();
    private get _inputDir(): number {
        return this._inputDirs.getLast();
    }
    private _inputForwardAxis: number = 0;
    private _inputSideAxis: number = 0;
    private _inputRotateAxis: number = 0;

    public currentPath: BABYLON.Vector2[];

    public currentTarget: GameObject;

    public hitpoint: number = 10;
    public hitpointMax: number = 10;

    constructor(main: Main) {
        super(main);
        this.target = new RobotTarget(this);
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

                this.main.scene.onBeforeRenderObservable.add(this._update);
			}
		)
    }

    private _movingLegCount: number = 0;
    private _movingLegs: UniqueList<number> = new UniqueList<number>();

    private async _moveLeg(legIndex: number, target: BABYLON.Vector3, targetR: number): Promise<void> {
        return new Promise<void>(
            resolve => {
                this._movingLegs.push(legIndex);
                let origin = this.feet[legIndex].position.clone();
                let originR = this.feet[legIndex].rotation.y;
                let l = target.subtract(origin).length();
                let duration = 1.5;
                let t = 0;
                let step = () => {
                    t += this.main.scene.getEngine().getDeltaTime() / 1000;
                    let d = t / duration;
                    d = d * d;
                    d = Math.min(d, 1);
                    this.feet[legIndex].position.copyFrom(
                        origin.scale(1 - d).add(target.scale(d))
                    );
                    this.feet[legIndex].position.y = 0.35 + 0.65 * Math.sin(Math.PI * d);
                    this.feet[legIndex].rotation.y = Math2D.LerpFromToCircular(originR, targetR, d);
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

    private _update = () => {

        let forwardSpeed: number = 0;
        if (this._inputForwardAxis > 0) {
            forwardSpeed = 1 * this._inputForwardAxis;
        }
        else if (this._inputForwardAxis < 0) {
            forwardSpeed = - 0.5 * this._inputForwardAxis;
        }

        let rotateSpeed: number = this._inputRotateAxis * 0.4;
        let sideSpeed: number = 2 * this._inputSideAxis;

        if (this._inputDirs.contains(0)) {
            sideSpeed = 2;
        }
        if (this._inputDirs.contains(1)) {
            forwardSpeed = - 0.5;
        }
        if (this._inputDirs.contains(2)) {
            sideSpeed = - 2;
        }
        if (this._inputDirs.contains(3)) {
            forwardSpeed = 1;
        }
        if (this._inputDirs.contains(4)) {
            rotateSpeed = 0.4;
        }
        if (this._inputDirs.contains(5)) {
            rotateSpeed = - 0.4;
        }

        this.target.position.addInPlace(this.target.forward.scale(forwardSpeed * this.main.scene.getEngine().getDeltaTime() / 1000));
        this.target.position.addInPlace(this.target.right.scale(sideSpeed * this.main.scene.getEngine().getDeltaTime() / 1000));
        this.target.rotation.y -= rotateSpeed * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000;

        while (this.target.rotation.y < 0) {
            this.target.rotation.y += 2 * Math.PI;
        }
        while (this.target.rotation.y >= 2 * Math.PI) {
            this.target.rotation.y -= 2 * Math.PI;
        }

        if (this._movingLegCount <= 0) {
            let index = - 1;
            let dist = 0;
            for (let i = 0; i < 2; i++) {
                if (!this._movingLegs.contains(i)) {
                    let iDist = BABYLON.Vector3.DistanceSquared(this.feet[i].position, this.target.targets[i].absolutePosition);
                    if (iDist > dist) {
                        dist = iDist;
                        index = i;
                    }
                }
            }
            if (dist > 0.1) {
                this._movingLegCount++;
                this._moveLeg(index, this.target.targets[index].absolutePosition, this.target.rotation.y); 
            }
        }
        if (!this.currentPath || this.currentPath.length === 0) {
            this._updatePath();
        }
        this.moveOnPath();
        this._updateMesh();
    }

    public nextDebugMesh: BABYLON.Mesh;

    private _updatePath = () => {
        if (!this.currentTarget) {
            this.currentTarget = this.main.gameObjects.find(go => { return go instanceof CommandCenter; });
        }
        if (this.currentTarget) {
            let navGraph = NavGraphManager.GetForRadius(2);
            navGraph.update();
            this.currentPath = navGraph.computePathFromTo(this.target.pos2D, this.currentTarget.pos2D);
        }
    }

    public moveOnPath(): void {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            if (!this.nextDebugMesh) {
                this.nextDebugMesh = BABYLON.MeshBuilder.CreateBox("next-debug-mesh", { size: 0.5 });
            }
            this.nextDebugMesh.position.x = next.x;
            this.nextDebugMesh.position.z = next.y;
            let distanceToNext = Math2D.Distance(this.target.pos2D, next);
            if (distanceToNext <= 1) {
                this.currentPath.splice(0, 1);
                return this.moveOnPath();
            }
            let stepToNext = next.subtract(this.target.pos2D).normalize();
            
            let targetRot = - Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
            let dRot = - Math2D.AngularDistance(this.target.rotation.y, targetRot);
            
            let dRotFactor = Math.abs(dRot) / (Math.PI * 0.5);
            dRotFactor = Math.min(Math.max(1 - dRotFactor, 0), 1);
            this._inputForwardAxis = dRotFactor;

            this._inputDirs.remove(4);
            this._inputDirs.remove(5);
            if (dRot < 0) {
                this._inputDirs.push(5);
            }
            if (dRot > 0) {
                this._inputDirs.push(4);
            }

            document.getElementById("distance-to-next").innerText = distanceToNext.toFixed(1) + (Math.random() > 0.5 ? " ." : "");
            document.getElementById("target-rot").innerText = (this.target.rotation.y / Math.PI * 180).toFixed(1) + "°" + (dRot / Math.PI * 180).toFixed(1) + "°";
        }
    }

    public wound(n: number): void {
        this.hitpoint -= n;
        if (this.hitpoint <= 0) {
            this.main.game.credit(10);
            this.dispose();
        }
    }

    private _bodyVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public _updateMesh = () => {
        let dt = this.main.engine.getDeltaTime() / 1000;

        let targetBody = this.feet[0].absolutePosition.add(this.feet[1].absolutePosition).scaleInPlace(0.5);
        targetBody.y += 1.5;

        let fBody = targetBody.subtract(this.body.position);
        this._bodyVelocity.addInPlace(fBody.scaleInPlace(dt));
        this._bodyVelocity.scaleInPlace(0.95);
        this.body.position.addInPlace(this._bodyVelocity);

        this.body.rotation.x = (this.body.position.y - 1.5) * Math.PI / 6;
        this.body.rotation.y = this.target.rotation.y;

        this.head.rotation.x = - this.body.rotation.x;

        let kneeTargets = [this.body.position.clone(), this.body.position.clone()];
        kneeTargets[0].addInPlace(this.body.forward.scale(-5));
        kneeTargets[0].addInPlace(this.body.right.scale(2.5));
        kneeTargets[1].addInPlace(this.body.forward.scale(-5));
        kneeTargets[1].addInPlace(this.body.right.scale(-2.5));

        let upperLegLength = 1.17;
        let legLength = 1.25;

        let elbowTargets = [this.body.position.clone(), this.body.position.clone()];
        elbowTargets[0].addInPlace(this.body.forward.scale(- 2.5));
        elbowTargets[0].addInPlace(this.body.right.scale(5));
        elbowTargets[1].addInPlace(this.body.forward.scale(- 2.5));
        elbowTargets[1].addInPlace(this.body.right.scale(-5));

        let upperArmLength = 0.72;
        let armLength = 0.77;

        this.hands[0].position.copyFrom(this.body.position);
        this.hands[0].position.addInPlace(this.body.right.scale(1.5));
        this.hands[0].position.addInPlace(this.body.up.scale(- 1));
        this.hands[0].position.addInPlace(this.body.forward.scale(1));
        
        this.hands[1].position.copyFrom(this.body.position);
        this.hands[1].position.addInPlace(this.body.right.scale(- 1.5));
        this.hands[1].position.addInPlace(this.body.up.scale(- 1));
        this.hands[1].position.addInPlace(this.body.forward.scale(1));

        for (let i = 0; i < 2; i++) {
            let k = kneeTargets[i];
            let h = this.upperLegsRoot[i].absolutePosition; 
            let f = this.feet[i].position;
            for (let n = 0; n < 3; n++) {
                let hk = k.subtract(h).normalize().scale(upperLegLength);
                k = h.add(hk);
                
                let fk = k.subtract(f).normalize().scale(legLength);
                k = f.add(fk);
            }
            this.legs[i].position.copyFrom(k);

            let upperLegY = k.subtract(f);
            let upperLegZ = k.subtract(h);
            let upperLegX = BABYLON.Vector3.Cross(upperLegY, upperLegZ);
            upperLegY = BABYLON.Vector3.Cross(upperLegZ, upperLegX);
            this.upperLegs[i].position.copyFrom(h);
            this.upperLegs[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(upperLegX, upperLegY, upperLegZ);

            let legY = h.subtract(k);
            let legZ = f.subtract(k);
            let legX = BABYLON.Vector3.Cross(legY, legZ);
            legY = BABYLON.Vector3.Cross(legZ, legX);
            this.legs[i].position.copyFrom(k);
            this.legs[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(legX, legY, legZ);

            let e = elbowTargets[i];
            let s = this.upperArmsRoot[i].absolutePosition; 
            let ha = this.hands[i].position;
            for (let n = 0; n < 3; n++) {
                let se = e.subtract(s).normalize().scale(upperArmLength);
                e = s.add(se);
                
                let hae = e.subtract(ha).normalize().scale(armLength);
                e = ha.add(hae);
            }
            this.arms[i].position.copyFrom(e);

            let upperArmY = e.subtract(ha);
            let upperArmZ = e.subtract(s);
            let upperArmX = BABYLON.Vector3.Cross(upperArmY, upperArmZ);
            upperArmY = BABYLON.Vector3.Cross(upperArmZ, upperArmX);
            this.upperArms[i].position.copyFrom(s);
            this.upperArms[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(upperArmX, upperArmY, upperArmZ);

            let armY = e.subtract(s);
            let armZ = ha.subtract(e);
            let armX = BABYLON.Vector3.Cross(armY, armZ);
            armY = BABYLON.Vector3.Cross(armZ, armX);
            this.arms[i].position.copyFrom(e);
            this.arms[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(armX, armY, armZ);
            
            this.hands[i].rotationQuaternion = this.arms[i].rotationQuaternion;
        }
    }
}
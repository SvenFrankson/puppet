enum RobotMode {
    Walk,
    Run
}

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
            new BABYLON.Vector2(0.8, 0),
            new BABYLON.Vector2(- 0.8, 0)
        ]
        for (let i = 0; i < 2; i++) {
            let target = new BABYLON.Mesh("target-" + i);
            target.position.x = positions[i].x;
            target.position.z = positions[i].y;
            target.parent = this;
            this.targets[i] = target;

            //BABYLON.VertexData.CreateBox({ width: 0.2, height: 20, depth: 0.2 }).applyToMesh(target);
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

    public footImpactParticle: BABYLON.ParticleSystem;

    public mode: RobotMode = RobotMode.Walk;

    public target: RobotTarget;
    private _inputDirs: UniqueList<number> = new UniqueList<number>();
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

        this.footImpactParticle = new BABYLON.ParticleSystem("particles", 20, this.main.scene);
        this.footImpactParticle.particleTexture = new BABYLON.Texture("assets/dust.png", this.main.scene);
        this.footImpactParticle.targetStopDuration = 0.3;

        this.footImpactParticle.maxLifeTime = 0.3;

        this.footImpactParticle.addSizeGradient(0, 0);
        this.footImpactParticle.addSizeGradient(0.1, 0);
        this.footImpactParticle.addSizeGradient(0.2, 1);
        this.footImpactParticle.addSizeGradient(1, 0);

        this.footImpactParticle.addVelocityGradient(0, 5);
        this.footImpactParticle.addVelocityGradient(0.1, 5);
        this.footImpactParticle.addVelocityGradient(0.2, 1);
        this.footImpactParticle.addSizeGradient(1, 0.5);

        this.footImpactParticle.color1 = new BABYLON.Color4(1, 1, 1, 1);
        this.footImpactParticle.color2 = new BABYLON.Color4(1, 1, 1, 1);

        this.footImpactParticle.emitRate = 1000;
    }

    public async instantiate(): Promise<void> {
        return new Promise<void>(
            resolve => {
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
                        this.feet[0].rotationQuaternion = BABYLON.Quaternion.Identity();
                        this.feet[1].rotationQuaternion = BABYLON.Quaternion.Identity();
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
                                let toonMaterial = new ToonMaterial(mesh.material.name + "-toon", false, this.main.scene);
                                if (mesh.material.name === "RobotMaterial") {
                                    toonMaterial.setTexture("colorTexture", new BABYLON.Texture("assets/robot-texture.png", this.main.scene));
                                }
                                toonMaterial.setColor(mesh.material.albedoColor);
                                mesh.material = toonMaterial;
                            }
                        }
        
                        this.main.scene.onBeforeRenderObservable.add(this._update);
                        resolve();
                    }
                )
            }
        );
    }
    
    private _update = () => {
        this._generateInputs();
        this._updateLegTarget();
        this._updateLegMove();
        this._updatePath();
        this._updateCollisions();
        this._updateMesh();
    }

    private _generateInputs(): void {
        if (this.currentPath && this.currentPath.length > 0) {
            let next = this.currentPath[0];
            let distanceToNext = Math2D.Distance(this.target.pos2D, next);
            if (distanceToNext <= 1) {
                this.currentPath.splice(0, 1);
                return this._generateInputs();
            }
            let stepToNext = next.subtract(this.target.pos2D).normalize();
            
            let targetRot = - Math2D.AngleFromTo(new BABYLON.Vector2(0, 1), stepToNext);
            let dRot = - Math2D.AngularDistance(this.target.rotation.y, targetRot);
            
            let dRotFactor = Math.abs(dRot) / (Math.PI * (this.mode === RobotMode.Walk ? 0.5 : 1.5));
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
        }
    }

    private _updateLegTarget(): void {
        let forwardSpeed: number = 0;
        if (this._inputForwardAxis > 0) {
            forwardSpeed = (1 + (this.mode === RobotMode.Run ? 3 : 0)) * this._inputForwardAxis;
        }
        else if (this._inputForwardAxis < 0) {
            forwardSpeed = - 0.5 * this._inputForwardAxis;
        }
        forwardSpeed *= this._dragFactor;

        let rotateSpeed: number = this._inputRotateAxis * 0.1;
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
        let f0ry = VMath.AngleFromToAround(BABYLON.Axis.Z, this.feet[0].forward, BABYLON.Axis.Y);
        let f1ry = VMath.AngleFromToAround(BABYLON.Axis.Z, this.feet[1].forward, BABYLON.Axis.Y);
        this.target.rotation.y = Math2D.AngularClamp(f1ry - Math.PI / 8, f0ry + Math.PI / 8, this.target.rotation.y);

        while (this.target.rotation.y < 0) {
            this.target.rotation.y += 2 * Math.PI;
        }
        while (this.target.rotation.y >= 2 * Math.PI) {
            this.target.rotation.y -= 2 * Math.PI;
        }
    }

    private _movingLegCount: number = 0;
    private _movingLegs: UniqueList<number> = new UniqueList<number>();
    private _abortLegMove: boolean = false;

    private async _moveLeg(legIndex: number, target: BABYLON.Vector3, targetQ: BABYLON.Quaternion): Promise<void> {
        return new Promise<void>(
            resolve => {
                this._movingLegs.push(legIndex);
                let origin = this.feet[legIndex].position.clone();
                let originQ = this.feet[legIndex].rotationQuaternion.clone();
                let l = target.subtract(origin).length();
                let duration = 1.5;
                if (this.mode === RobotMode.Run) {
                    duration = 0.6;
                }
                let t = 0;
                let step = () => {
                    if (this._abortLegMove) {
                        requestAnimationFrame(
                            () => {
                                this._abortLegMove = false;
                                this._movingLegCount -= 1;
                                this._movingLegs.remove(legIndex);
                            }
                        )
                        return;
                    }
                    t += this.main.scene.getEngine().getDeltaTime() / 1000;
                    let d = t / duration;
                    if (this.mode === RobotMode.Walk) {
                        d = d * d;
                    }
                    else {
                        d = Math.pow(d, 1.5);
                    }
                    d = Math.min(d, 1);
                    this.feet[legIndex].position.copyFrom(
                        origin.scale(1 - d).add(target.scale(d))
                    );
                    if (legIndex === 0) {
                        this.feet[legIndex].position.addInPlace(this.target.right.scale((this.mode === RobotMode.Walk ? 1: 0.6) * Math.sin(Math.PI * d)));
                    }
                    else {
                        this.feet[legIndex].position.addInPlace(this.target.right.scale(- (this.mode === RobotMode.Walk ? 1: 0.6) * Math.sin(Math.PI * d)));
                    }
                    this.feet[legIndex].position.y += (this.mode === RobotMode.Walk ? 0.65: 0.4) * Math.sin(Math.PI * d) * this._dragFactor;
                    this.feet[legIndex].rotationQuaternion = BABYLON.Quaternion.Slerp(originQ, targetQ, d);
                    if (d < 1) {
                        requestAnimationFrame(step);
                    }
                    else {
                        this._movingLegCount -= 1;
                        this._movingLegs.remove(legIndex);                        

                        this.footImpactParticle.emitter = this.feet[legIndex].position.subtract(this.feet[legIndex].up.scale(0.4));
                        this.footImpactParticle.startDirectionFunction = (worldMatrix: BABYLON.Matrix, directionToUpdate: BABYLON.Vector3, particle: BABYLON.Particle) => {
                            let a = 2 * Math.PI * Math.random();
                            let b = Math.PI / 16;
                            let right = this.feet[legIndex].right.scale(Math.cos(a) * Math.cos(b));
                            let up = this.feet[legIndex].up.scale(Math.sin(b));
                            let forward = this.feet[legIndex].forward.scale(Math.sin(a) * Math.cos(b));
                            directionToUpdate.copyFrom(right).addInPlace(up).addInPlace(forward).scaleInPlace(1);
                        }
                        this.footImpactParticle.start();
                        
                        resolve();
                    }
                }
                step();
            }
        )
    }

    private _currentLegIndex: number = 0;
    private _updateLegMove(): void {
        if (this._movingLegCount <= 0) {
            
            let fp = this.feet[this._currentLegIndex].position.clone();
            fp.y = 0;
            let ft = this.target.targets[this._currentLegIndex].absolutePosition.clone();
            ft.y = 0;
            let dist = BABYLON.Vector3.DistanceSquared(fp, ft);
            
            if (dist > 0.05) {
                let ray = new BABYLON.Ray(this.target.targets[this._currentLegIndex].absolutePosition.add(BABYLON.Axis.Y.scale(100)), BABYLON.Vector3.Down(), 200);
                let hit = ray.intersectsMesh(this.main.ground);
                if (hit.hit) {
                    this._movingLegCount++;
                    let fy = hit.getNormal(true, true);
                    let fz = this.target.forward;
                    let fx = BABYLON.Vector3.Cross(fy, fz);
                    fz = BABYLON.Vector3.Cross(fx, fy);
                    this._moveLeg(
                        this._currentLegIndex,
                        hit.pickedPoint.add(new BABYLON.Vector3(0, 0.4, 0)),
                        BABYLON.Quaternion.RotationQuaternionFromAxis(fx, fy, fz).multiply(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, (this._currentLegIndex === 0 ? 1 : - 1) * Math.PI / 6))
                    );
                    this._currentLegIndex = (this._currentLegIndex + 1) % 2;
                }
            }
        }
    }

    private _updatePath(): void{
        /*
        if (!this.currentTarget) {
            this.currentTarget = this.main.gameObjects.find(go => { return go instanceof CommandCenter; });
        }
        if (this.currentTarget) {
            let navGraph = NavGraphManager.GetForRadius(2);
            navGraph.update();
            this.currentPath = navGraph.computePathFromTo(this.target.pos2D, this.currentTarget.pos2D);
        }
        */
        if (!this.currentPath || this.currentPath.length === 0) {
            let navGraph = NavGraphManager.GetForRadius(2);
            navGraph.update();
            let rand = new BABYLON.Vector2(- 30 + 60 * Math.random(), - 30 + 60 * Math.random());
            this.currentPath = navGraph.computePathFromTo(this.target.pos2D, rand);
        }
    }

    private _updateCollisions(): void {
        let robots = this.main.gameObjects.filter(g => { return g instanceof Robot; }) as Robot[];
        let d = BABYLON.Vector3.Zero();
        let n = 0;
        for (let i = 0; i < robots.length; i++) {
            let other = robots[i];
            if (other != this && other.body) {
                let bp = this.body.position.clone();
                bp.y = 0;
                let op = other.body.position.clone();
                op.y = 0;
                let sqrDist = BABYLON.Vector3.Distance(bp, op);
                if (sqrDist < 4) {
                    let l = Math.sqrt(sqrDist);
                    let v = bp.subtract(op).normalize().scaleInPlace(2 - l);
                    d.addInPlace(v);
                    n++;
                }
            }
        }
        if (n > 0) {
            d.scaleInPlace(1 / n);
            d.scaleInPlace(0.5);
            this.body.position.addInPlace(d);
            this.feet[0].position.addInPlace(d);
            this.feet[1].position.addInPlace(d);
            d.scaleInPlace(0.5);
            this.target.position.addInPlace(d);
        }
    }

    private _bodyVelocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _handVelocities: BABYLON.Vector3[] = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
    private _dragFactor: number = 1;
    public _updateMesh(): void {
        let dt = this.main.engine.getDeltaTime() / 1000;
        this._dragFactor = Math.min(this._dragFactor + 0.25 * dt, 1);

        let bodyH = this.mode === RobotMode.Walk ? 1.8 : 1.6;
        let targetBody = this.feet[0].absolutePosition.add(this.feet[1].absolutePosition).scaleInPlace(0.5);
        targetBody.addInPlace(this.body.forward.scale(this.mode === RobotMode.Walk ? 0.5: 1.2));
        targetBody.y += bodyH;

        let fBody = targetBody.subtract(this.body.position);
        this._bodyVelocity.addInPlace(fBody.scaleInPlace((this.mode === RobotMode.Walk ? 0.5: 2) * dt));
        this._bodyVelocity.scaleInPlace((this.mode === RobotMode.Walk ? 0.97: 0.9) * this._dragFactor);
        this.body.position.addInPlace(this._bodyVelocity);

        let dot = BABYLON.Vector3.Dot(this.feet[1].position.subtract(this.feet[0].position).normalize(), this.body.forward);
        let dy = this.feet[0].position.y - this.feet[1].position.y;

        let targetRotX = (this.body.position.y - Math.min(this.feet[0].position.y, this.feet[1].position.y) - bodyH) * Math.PI / 10;
        this.body.rotation.x = Math2D.LerpFromToCircular(this.body.rotation.x, targetRotX, 0.1);
        this.body.rotation.y = Math2D.LerpFromToCircular(this.body.rotation.y, this.target.rotation.y + dot * (this.mode === RobotMode.Walk ? Math.PI / 10: Math.PI / 6), 0.2);
        this.body.rotation.z = dy * Math.PI / 10;

        this.head.position.copyFrom(this.body.position);
        this.head.position.addInPlace(this.body.forward.scale(1.1));
       
        if (this.currentPath && this.currentPath[0]) {
            let z = new BABYLON.Vector3(
                this.currentPath[0].x,
                0.5,
                this.currentPath[0].y
            ).subtract(this.head.position);
            let x = BABYLON.Vector3.Cross(BABYLON.Axis.Y, z);
            let y = BABYLON.Vector3.Cross(z, x);
            let targetQ = BABYLON.Quaternion.RotationQuaternionFromAxis(x, y, z);
            let a = VMath.Angle(this.body.forward, z);
            let bodyQ = BABYLON.Quaternion.FromEulerVector(this.body.rotation);
            let f = Math.min(1, (Math.PI / 4) / a);
            targetQ = BABYLON.Quaternion.Slerp(bodyQ, targetQ, f);
            if (!this.head.rotationQuaternion) {
                this.head.rotationQuaternion = targetQ;
            }
            this.head.rotationQuaternion = BABYLON.Quaternion.Slerp(this.head.rotationQuaternion, targetQ, 0.1);
        }

        let handTargets = [this.body.position.clone(), this.body.position.clone()];
        handTargets[0].addInPlace(this.body.right.scale(1.2));
        handTargets[0].addInPlace(BABYLON.Axis.Y.scale(- 0.8));
        handTargets[0].addInPlace(this.body.forward.scale(1.5 + 0.5 * dot));
        handTargets[1].addInPlace(this.body.right.scale(- 1.2));
        handTargets[1].addInPlace(BABYLON.Axis.Y.scale(- 0.8));
        handTargets[1].addInPlace(this.body.forward.scale(1.5 - 0.5 * dot));

        for (let i = 0; i < 2; i++) {
            let fHand = handTargets[i].subtract(this.hands[i].position);
            this._handVelocities[i].addInPlace(fHand.scaleInPlace(3 * dt));
            this._handVelocities[i].scaleInPlace(0.7 * this._dragFactor);
            this.hands[i].position.addInPlace(this._handVelocities[i]);
        }

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

            let upperLegY = k.subtract(f);
            let upperLegZ = k.subtract(h);
            let upperLegX = BABYLON.Vector3.Cross(upperLegY, upperLegZ);
            upperLegY = BABYLON.Vector3.Cross(upperLegZ, upperLegX);
            BABYLON.Vector3.LerpToRef(this.upperLegs[i].position, h, 1, this.upperLegs[i].position);
            if (!this.upperLegs[i].rotationQuaternion) {
                this.upperLegs[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(upperLegX, upperLegY, upperLegZ);
            }
            BABYLON.Quaternion.SlerpToRef(this.upperLegs[i].rotationQuaternion, BABYLON.Quaternion.RotationQuaternionFromAxis(upperLegX, upperLegY, upperLegZ), 1, this.upperLegs[i].rotationQuaternion);

            let legY = h.subtract(k);
            let legZ = f.subtract(k);
            let legX = BABYLON.Vector3.Cross(legY, legZ);
            legY = BABYLON.Vector3.Cross(legZ, legX);
            BABYLON.Vector3.LerpToRef(this.legs[i].position, k, 1, this.legs[i].position);
            if (!this.legs[i].rotationQuaternion) {
                this.legs[i].rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(legX, legY, legZ);
            }
            BABYLON.Quaternion.SlerpToRef(this.legs[i].rotationQuaternion, BABYLON.Quaternion.RotationQuaternionFromAxis(legX, legY, legZ), 1, this.legs[i].rotationQuaternion);

            let e = elbowTargets[i];
            let s = this.upperArmsRoot[i].absolutePosition; 
            let ha = this.hands[i].position;
            for (let n = 0; n < 3; n++) {
                let se = e.subtract(s).normalize().scale(upperArmLength);
                e = s.add(se);
                
                let hae = e.subtract(ha).normalize().scale(armLength);
                e = ha.add(hae);
            }

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

    public foldAt(pos2D: BABYLON.Vector2): void {
        let h = this.main.ground.getHeightAt(pos2D);
        this.body.position.x = pos2D.x;
        this.body.position.y = h;
        this.body.position.z = pos2D.y;
        this.feet[0].position.copyFrom(this.body.position);
        this.feet[1].position.copyFrom(this.body.position);
        this.feet[0].position.addInPlace(this.body.right.scale(0.5));
        this.feet[1].position.subtractInPlace(this.body.right.scale(0.5));
        this.hands[0].position.copyFrom(this.body.position);
        this.hands[1].position.copyFrom(this.body.position);

        this.body.position.y += 0.6;
        this.feet[0].position.y = this.main.ground.getHeightAt(this.feet[0].position) + 0.4;
        this.feet[1].position.y = this.main.ground.getHeightAt(this.feet[1].position) + 0.4;

        this.target.posX = pos2D.x;
        this.target.posY = pos2D.y;
        this.target.computeWorldMatrix(true);

        this._abortLegMove = true;

        this._dragFactor = 0;
    }

    public wound(n: number): void {
        this.hitpoint -= n;
        if (this.hitpoint <= 0) {
            this.main.game.credit(10);
            this.dispose();
        }
    }
}
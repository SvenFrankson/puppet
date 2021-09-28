class PuppetTarget extends BABYLON.Mesh {

    public anchorFootRTarget: BABYLON.Mesh;
    public anchorFootLTarget: BABYLON.Mesh;

    constructor(
        public puppet: Puppet
    ) {
        super("target");

        this.anchorFootRTarget = BABYLON.MeshBuilder.CreateBox("anchorFootRTarget", { size: 0.05 });
        this.anchorFootRTarget.material = Main.redMaterial;
        this.anchorFootRTarget.position.copyFromFloats(this.puppet.pupperParams.footTargetDistance, 5, 0);
        this.anchorFootRTarget.parent = this;
        
        this.anchorFootLTarget = BABYLON.MeshBuilder.CreateBox("anchorFootLTarget", { size: 0.05 });
        this.anchorFootLTarget.material = Main.redMaterial;
        this.anchorFootLTarget.position.copyFromFloats(- this.puppet.pupperParams.footTargetDistance, 5, 0);
        this.anchorFootLTarget.parent = this;
    }
}

class Puppet {

    public pupperParams: PuppetParameters = new PuppetParameters();

    public puppetControler: PuppetControler;
    public target: PuppetTarget;

    public nodes: PuppetNode[] = [];
    public links: PuppetLink[] = [];

    public anchorHead: PuppetNode;
    public anchorHandR: PuppetNode;
    public anchorHandL: PuppetNode;
    public anchorFootR: PuppetNode;
    public anchorFootL: PuppetNode;

    public bodyMesh: BABYLON.Mesh;
    public legRMesh: BABYLON.Mesh;
    public footRMesh: BABYLON.Mesh;
    public legLMesh: BABYLON.Mesh;
    public footLMesh: BABYLON.Mesh;
    public armRMesh: BABYLON.Mesh;
    public foreArmRMesh: BABYLON.Mesh;
    public armLMesh: BABYLON.Mesh;
    public foreArmLMesh: BABYLON.Mesh;

    public bodyNode: PuppetNode;
    public kneeRNode: PuppetNode;
    public footRNode: PuppetNode;
    public kneeLNode: PuppetNode;
    public footLNode: PuppetNode;
    public shoulderNode: PuppetNode;
    public elbowRNode: PuppetNode;
    public handRNode: PuppetNode;
    public elbowLNode: PuppetNode;
    public handLNode: PuppetNode;

    constructor(
        initialPosition: BABYLON.Vector3,
        material?: BABYLON.Material
    ) {
        this.pupperParams.randomize();

        this.target = new PuppetTarget(this);
        this.target.position.x = initialPosition.x;
        this.target.position.z = initialPosition.z;

        this.bodyNode = new PuppetNode({
            positionZero: initialPosition,
            fluidC: this.pupperParams.bodyFluidC,
            showMesh: false
        });
        this.bodyNode.gravity = () => {
            let n = this.pupperParams.bodyGravity.clone();
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(30 * this.bodyNode.mass);
            return n;
        }

        this.kneeRNode = new PuppetNode({
            positionZero: initialPosition,
            mass: this.pupperParams.kneeMass,
            fluidC: this.pupperParams.kneeFluidC,
            showMesh: false
        });
        this.kneeRNode.gravity = () => {
            let n = this.pupperParams.kneeRGravity.clone();
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.kneeGravityFactor * this.kneeRNode.mass);
            return n;
        }
        this.kneeLNode = new PuppetNode({
            positionZero: initialPosition,
            mass: this.pupperParams.kneeMass,
            fluidC: this.pupperParams.kneeFluidC,
            showMesh: false
        });
        this.kneeLNode.gravity = () => {
            let n = this.pupperParams.kneeRGravity.clone();
            n.x *= -1;
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.kneeGravityFactor * this.kneeLNode.mass);
            return n;
        }
        this.footRNode = new PuppetNode({
            positionZero: initialPosition,
            mass: this.pupperParams.footMass,
            fluidC: this.pupperParams.footFluidC,
            groundC: this.pupperParams.footGroundC,
            showMesh: false
        });
        this.footLNode = new PuppetNode({
            positionZero: initialPosition,
            mass: this.pupperParams.footMass,
            fluidC: this.pupperParams.footFluidC,
            groundC: this.pupperParams.footGroundC,
            showMesh: false
        });

        this.shoulderNode = new PuppetNode({
            positionZero: initialPosition,
            fluidC: this.pupperParams.shoulderFluidC,
            showMesh: false
        });
        this.elbowRNode = new PuppetNode({
            positionZero: initialPosition,
            mass: this.pupperParams.elbowMass,
            fluidC: this.pupperParams.elbowFluidC,
            showMesh: false
        });
        this.elbowRNode.gravity = () => {
            let n = this.pupperParams.elbowRGravity.clone();
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.elbowGravityFactor * this.elbowRNode.mass);
            return n;
        }
        this.elbowLNode = new PuppetNode({
            positionZero: initialPosition,
            mass: this.pupperParams.elbowMass,
            fluidC: this.pupperParams.elbowFluidC,
            showMesh: false
        });
        this.elbowLNode.gravity = () => {
            let n = this.pupperParams.elbowRGravity.clone();
            n.x *= -1;
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(this.pupperParams.elbowGravityFactor * this.elbowLNode.mass);
            return n;
        }
        this.handRNode = new PuppetNode({
            positionZero: initialPosition,
            fluidC: this.pupperParams.handFluidC,
            showMesh: false
        });
        this.handLNode = new PuppetNode({
            positionZero: initialPosition,
            fluidC: this.pupperParams.handFluidC,
            showMesh: false
        });

        this.links.push(PuppetSpring.Connect(this.bodyNode, this.kneeRNode, this.pupperParams.upperLegSpringK));
        this.links.push(PuppetSpring.Connect(this.bodyNode, this.kneeLNode, this.pupperParams.upperLegSpringK));
        this.links.push(PuppetSpring.Connect(this.kneeRNode, this.footRNode, this.pupperParams.lowerLegSpringK));
        this.links.push(PuppetSpring.Connect(this.kneeLNode, this.footLNode, this.pupperParams.lowerLegSpringK));
        let torso = PuppetSpring.Connect(this.bodyNode, this.shoulderNode, this.pupperParams.torsoSpringK);
        this.links.push(torso);
        this.links.push(PuppetSpring.Connect(this.shoulderNode, this.elbowRNode, this.pupperParams.armSpringK, 0.8));
        this.links.push(PuppetSpring.Connect(this.shoulderNode, this.elbowLNode, this.pupperParams.armSpringK, 0.8));
        this.links.push(PuppetSpring.Connect(this.elbowRNode, this.handRNode, this.pupperParams.foreArmSpringK, 0.8));
        this.links.push(PuppetSpring.Connect(this.elbowLNode, this.handLNode, this.pupperParams.foreArmSpringK, 0.8));

        this.anchorFootR = new PuppetNode();
        this.anchorFootR.position.copyFromFloats(0.5, 5, 0).addInPlace(initialPosition);
        this.links.push(PuppetRope.Connect(this.footRNode, this.anchorFootR));

        this.anchorFootL = new PuppetNode();
        this.anchorFootL.position.copyFromFloats(- 0.5, 5, 0).addInPlace(initialPosition);
        this.links.push(PuppetRope.Connect(this.footLNode, this.anchorFootL));

        this.anchorHead = new PuppetNode();
        this.anchorHead.position.copyFromFloats(0, 5, 0).addInPlace(initialPosition);
        let headRope = PuppetRope.Connect(this.shoulderNode, this.anchorHead);
        headRope.l0 = 2;
        this.links.push(headRope);

        this.anchorHandR = new PuppetNode();
        this.anchorHandR.position.copyFrom(this.anchorHead.position);
        this.anchorHandR.position.addInPlace(this.pupperParams.handAnchorPosition);
        let handRRope = PuppetRope.Connect(this.handRNode, this.anchorHandR);
        handRRope.l0 = 3;
        this.links.push(handRRope);

        this.anchorHandL = new PuppetNode();
        this.anchorHandL.position.copyFrom(this.pupperParams.handAnchorPosition);
        this.anchorHandL.position.x *= -1;
        this.anchorHandL.position.addInPlace(this.anchorHead.position);
        let handLRope = PuppetRope.Connect(this.handLNode, this.anchorHandL);
        handLRope.l0 = 3;
        this.links.push(handLRope);

        this.nodes = [this.bodyNode, this.shoulderNode, this.kneeRNode, this.kneeLNode, this.footRNode, this.footLNode, this.elbowRNode, this.elbowLNode, this.handRNode, this.handLNode];

        this.bodyMesh = new BABYLON.Mesh("bodymesh");
        this.bodyMesh.position.copyFrom(initialPosition);
        this.bodyMesh.material = material;
        this.legRMesh = new BABYLON.Mesh("legRMesh");
        this.legRMesh.position.copyFrom(initialPosition);
        this.legRMesh.material = material;
        this.legLMesh = new BABYLON.Mesh("legLMesh");
        this.legLMesh.position.copyFrom(initialPosition);
        this.legLMesh.material = material;
        this.footRMesh = new BABYLON.Mesh("footRMesh");
        this.footRMesh.position.copyFrom(initialPosition);
        this.footRMesh.material = material;
        this.footLMesh = new BABYLON.Mesh("footLMesh");
        this.footLMesh.position.copyFrom(initialPosition);
        this.footLMesh.material = material;
        this.armRMesh = new BABYLON.Mesh("armRMesh");
        this.armRMesh.position.copyFrom(initialPosition);
        this.armRMesh.material = material;
        this.armLMesh = new BABYLON.Mesh("armLMesh");
        this.armLMesh.position.copyFrom(initialPosition);
        this.armLMesh.material = material;
        this.foreArmRMesh = new BABYLON.Mesh("foreArmRMesh");
        this.foreArmRMesh.position.copyFrom(initialPosition);
        this.foreArmRMesh.material = material;
        this.foreArmLMesh = new BABYLON.Mesh("foreArmLMesh");
        this.foreArmLMesh.position.copyFrom(initialPosition);
        this.foreArmLMesh.material = material;
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/models/puppet.babylon",
            "",
            Main.Scene,
            (meshes) => {
                let body = meshes.find(m => { return m.name === "body"; }) as BABYLON.Mesh;
                let leg = meshes.find(m => { return m.name === "leg"; }) as BABYLON.Mesh;
                let foot = meshes.find(m => { return m.name === "foot"; }) as BABYLON.Mesh;
                let arm = meshes.find(m => { return m.name === "arm"; }) as BABYLON.Mesh;
                let foreArm = meshes.find(m => { return m.name === "forearm"; }) as BABYLON.Mesh;
                if (body && leg && foot) {
                    let bodyMeshData = BABYLON.VertexData.ExtractFromMesh(body);
                    bodyMeshData.applyToMesh(this.bodyMesh);
                    let legMeshData = BABYLON.VertexData.ExtractFromMesh(leg);
                    let footMeshData = BABYLON.VertexData.ExtractFromMesh(foot);
                    let armMeshData = BABYLON.VertexData.ExtractFromMesh(arm);
                    let foreArmMeshData = BABYLON.VertexData.ExtractFromMesh(foreArm);
                    legMeshData.applyToMesh(this.legRMesh);
                    legMeshData.applyToMesh(this.legLMesh);
                    footMeshData.applyToMesh(this.footRMesh);
                    footMeshData.applyToMesh(this.footLMesh);
                    armMeshData.applyToMesh(this.armRMesh);
                    armMeshData.applyToMesh(this.armLMesh);
                    foreArmMeshData.applyToMesh(this.foreArmRMesh);
                    foreArmMeshData.applyToMesh(this.foreArmLMesh);

                    body.dispose();
                    leg.dispose();
                    arm.dispose();
                    foreArm.dispose();
                }
            }
        );
    }

    public t: number = 0;
    private _movingLegCount: number = 0;
    public update(): void {
        let dt = Main.Engine.getDeltaTime() / 1000;
        dt = Math.min(dt, 1 / 30);
        this.t += dt;
        
        if (this.puppetControler) {
            if (this.puppetControler.inputDirs.contains(0)) {
                this.target.position.addInPlace(this.target.right.scale(3 * dt));
            }
            if (this.puppetControler.inputDirs.contains(1)) {
                this.target.position.subtractInPlace(this.target.forward.scale(2 * dt));
            }
            if (this.puppetControler.inputDirs.contains(2)) {
                this.target.position.subtractInPlace(this.target.right.scale(3 * dt));
            }
            if (this.puppetControler.inputDirs.contains(3)) {
                this.target.position.addInPlace(this.target.forward.scale(5 * dt));
            }
            if (this.puppetControler.inputDirs.contains(4)) {
                this.target.rotation.y -= 0.5 * Math.PI * dt;
            }
            if (this.puppetControler.inputDirs.contains(5)) {
                this.target.rotation.y += 0.5 * Math.PI * dt;
            }
        }

        let extend = this.target.position.subtract(this.bodyMesh.position);
        extend.y = 0;
        if (extend.length() > 3) {
            extend.normalize();
            extend.scaleInPlace(3);
        }
        this.target.position.x = this.bodyMesh.position.x + extend.x;
        this.target.position.z = this.bodyMesh.position.z + extend.z;

        if (this._movingLegCount <= 0) {
            let distR = BABYLON.Vector3.Distance(this.anchorFootR.position, this.target.anchorFootRTarget.absolutePosition);
            let distL = BABYLON.Vector3.Distance(this.anchorFootL.position, this.target.anchorFootLTarget.absolutePosition);
            let maxDist = Math.max(2, Math.min(4, 2 + Math.abs(distR - distL)));
            if (distR > 0.01 || distL > 0.01) {
                if (distR > distL) {
                    this._movingLegCount++;
                    let t = this.target.anchorFootRTarget.absolutePosition.clone();
                    if (distR > maxDist) {
                        t = this.target.anchorFootRTarget.absolutePosition.subtract(this.anchorFootR.position).normalize().scaleInPlace(maxDist).addInPlace(this.anchorFootR.position);
                    }
                    this._moveLeg(0, t).then(
                        () => {
                            this._movingLegCount--;
                        }
                    );
                }
                else {
                    this._movingLegCount++;
                    let t = this.target.anchorFootLTarget.absolutePosition.clone();
                    if (distL > maxDist) {
                        t = this.target.anchorFootLTarget.absolutePosition.subtract(this.anchorFootL.position).normalize().scaleInPlace(maxDist).addInPlace(this.anchorFootL.position);
                    }
                    this._moveLeg(1, t).then(
                        () => {
                            this._movingLegCount--;
                        }
                    );
                }
            }
        }

        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].update();
        }
        for (let i = 0; i < this.links.length; i++) {
            //this.links[i].update();
        }

        let bodyPos = this.bodyNode.position.clone();
        let shoulderPos = this.shoulderNode.position.clone();
        let kneeRPos = this.kneeRNode.position.clone();
        let footRPos = this.footRNode.position.clone();
        let kneeLPos = this.kneeLNode.position.clone();
        let footLPos = this.footLNode.position.clone();
        let elbowRPos = this.elbowRNode.position.clone();
        let handRPos = this.handRNode.position.clone();
        let elbowLPos = this.elbowLNode.position.clone();
        let handLPos = this.handLNode.position.clone();
        
        let bodyKneeDist = Math.sqrt(0.35 * 0.35 + 1 * 1);
        for (let i = 0; i < 3; i++) {
            VMath.SetABDistanceInPlace(shoulderPos, bodyPos, 1, true);
            VMath.SetABDistanceInPlace(footRPos, kneeRPos, 1, true);
            VMath.SetABDistanceInPlace(footLPos, kneeLPos, 1, true);
            VMath.SetABDistanceInPlace(kneeRPos, bodyPos, bodyKneeDist);
            VMath.SetABDistanceInPlace(kneeLPos, bodyPos, bodyKneeDist);
            let shoulderRPos = new BABYLON.Vector3(0.35, 1, 0);
            this.bodyMesh.getDirectionToRef(shoulderRPos, shoulderRPos);
            shoulderRPos.addInPlace(this.bodyMesh.position);
            VMath.SetABDistanceInPlace(elbowRPos, shoulderRPos, 0.8);
            let shoulderLPos = new BABYLON.Vector3(- 0.35, 1, 0);
            this.bodyMesh.getDirectionToRef(shoulderLPos, shoulderLPos);
            shoulderLPos.addInPlace(this.bodyMesh.position);
            VMath.SetABDistanceInPlace(elbowLPos, shoulderLPos, 0.8);
            VMath.SetABDistanceInPlace(handRPos, elbowRPos, 0.8, true);
            VMath.SetABDistanceInPlace(handLPos, elbowLPos, 0.8, true);
        }

        this.bodyMesh.position.copyFrom(bodyPos);
        let up = shoulderPos.subtract(bodyPos).normalize();
        let forward = this.target.forward;
        let right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.bodyMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.footRMesh.position.copyFrom(kneeRPos);
        up = kneeRPos.subtract(footRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.footRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.footLMesh.position.copyFrom(kneeLPos);
        up = kneeLPos.subtract(footLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.footLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.legRMesh.position.copyFromFloats(0.35, 0, 0);
        this.bodyMesh.getDirectionToRef(this.legRMesh.position, this.legRMesh.position);
        this.legRMesh.position.addInPlace(this.bodyMesh.position);
        up = this.legRMesh.position.subtract(kneeRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.legRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.legLMesh.position.copyFromFloats(- 0.35, 0, 0);
        this.bodyMesh.getDirectionToRef(this.legLMesh.position, this.legLMesh.position);
        this.legLMesh.position.addInPlace(this.bodyMesh.position);
        up = this.legLMesh.position.subtract(kneeLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.legLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.foreArmRMesh.position.copyFrom(elbowRPos);
        up = elbowRPos.subtract(handRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.foreArmRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.foreArmLMesh.position.copyFrom(elbowLPos);
        up = elbowLPos.subtract(handLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.foreArmLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.armRMesh.position.copyFromFloats(0.35, 1, 0);
        this.bodyMesh.getDirectionToRef(this.armRMesh.position, this.armRMesh.position);
        this.armRMesh.position.addInPlace(this.bodyMesh.position);
        up = this.armRMesh.position.subtract(elbowRPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.armRMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
        
        this.armLMesh.position.copyFromFloats(- 0.35, 1, 0);
        this.bodyMesh.getDirectionToRef(this.armLMesh.position, this.armLMesh.position);
        this.armLMesh.position.addInPlace(this.bodyMesh.position);
        up = this.armLMesh.position.subtract(elbowLPos).normalize();
        forward = this.target.forward;
        right = BABYLON.Vector3.Cross(up, forward).normalize();
        forward = BABYLON.Vector3.Cross(right, up);
        this.armLMesh.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(right, up, forward);
    }

    private async _moveLeg(legIndex: number, target: BABYLON.Vector3): Promise<void> {
        return new Promise<void>(
            resolve => {
                let foot = this.anchorFootR;
                if (legIndex === 1) {
                    foot = this.anchorFootL;
                }
                let origin = foot.position.clone();
                let l = target.subtract(origin).length();
                let duration = Math.max(0.5, Math.min(l, 1.5));
                duration *= 0.5;
                let t = 0;
                let step = () => {
                    
                    let dt = Main.Engine.getDeltaTime() / 1000;
                    dt = Math.min(dt, 1 / 30);
                    t += dt;
                    let d = t / duration;
                    
                    let df = d * 2;
                    df = Math.min(df, 1);

                    foot.position.copyFrom(
                        origin.scale(1 - d).add(target.scale(d))
                    );
                    foot.position.y = 5 + Math.sin(Math.PI * d) * (duration / 3);
                    this.anchorHead.position.x = (this.anchorFootR.position.x + this.anchorFootL.position.x) * 0.5;
                    this.anchorHead.position.z = (this.anchorFootR.position.z + this.anchorFootL.position.z) * 0.5;
                    let f = this.target.forward;
                    let r = this.target.right;
                    let dR = BABYLON.Vector3.Dot(f, this.anchorFootR.position.subtract(this.anchorHead.position));
                    this.anchorHandR.position.copyFrom(this.anchorHead.position);
                    this.anchorHandR.position.addInPlace(r.scale(this.pupperParams.handAnchorPosition.x)).addInPlace(f.scale(this.pupperParams.handAnchorPosition.z - 0.8 * dR));
                    let dL = BABYLON.Vector3.Dot(f, this.anchorFootL.position.subtract(this.anchorHead.position));
                    this.anchorHandL.position.copyFrom(this.anchorHead.position);
                    this.anchorHandL.position.addInPlace(r.scale(- this.pupperParams.handAnchorPosition.x)).addInPlace(f.scale(this.pupperParams.handAnchorPosition.z - 0.8 * dL));
                    
                    if (d < 1) {
                        requestAnimationFrame(step);
                    }
                    else {
                        resolve();
                    }
                }
                step();
            }
        )
    }
}

interface IPuppetNodeParam {
    positionZero?: BABYLON.Vector3;
    mass?: number;
    fluidC?: number;
    groundC?: number;
    showMesh?: boolean;
}

class PuppetNode {

    public mass: number = 0.1;
    public position: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public fluidC: number = 0.08;
    public groundC: number = 0.5;

    public links: PuppetLink[] = [];

    public mesh: BABYLON.Mesh;

    public gravity = () => {
        return new BABYLON.Vector3(0, - 9.8 * this.mass, 0);
    }

    constructor(
        param?: IPuppetNodeParam
    ) {
        this.position.copyFromFloats(
            - 1 + Math.random() * 2,
            - 1 + Math.random() * 2 + 2,
            - 1 + Math.random() * 2
        );

        if (param && param.positionZero) {
            this.position.addInPlace(param.positionZero);
        }
        if (param && isFinite(param.mass)) {
            this.mass = param.mass;
        }
        if (param && isFinite(param.fluidC)) {
            this.fluidC = param.fluidC;
        }
        if (param && isFinite(param.groundC)) {
            this.groundC = param.groundC;
        }

        if (param && param.showMesh) {
            this.mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 0.2 });
        }
    }

    public update(): void {
        let dt = Main.Engine.getDeltaTime() / 1000;
        dt = Math.min(dt, 1 / 30);
        let force = this.gravity();
        for (let i = 0; i < this.links.length; i++) {
            if (!(this.links[i] instanceof PuppetRope)) {
                force.addInPlace(this.links[i].getForceOn(this));
            }
        }
        if (this.position.y < 0.1) {
            force.x -= this.velocity.x * this.groundC;
            force.y -= this.velocity.y * this.fluidC;
            force.z -= this.velocity.z * this.groundC;
        }
        else {
            force.x -= this.velocity.x * this.fluidC;
            force.y -= this.velocity.y * this.fluidC;
            force.z -= this.velocity.z * this.fluidC;
        }
        
        let a = force.scaleInPlace(1 / this.mass);
        this.velocity.addInPlace(a.scaleInPlace(dt));
        
        this.position.addInPlace(this.velocity.scale(dt));

        for (let i = 0; i < this.links.length; i++) {
            let link = this.links[i];
            if (link instanceof PuppetRope) {
                let l = BABYLON.Vector3.Distance(
                    link.nodeA.position,
                    link.nodeB.position
                );
                if (l > link.l0) {
                    VMath.SetABDistanceInPlace(
                        link.nodeB.position,
                        link.nodeA.position,
                        link.l0,
                        true
                    );
                }
            }
        }

        if (this.mesh) {
            this.mesh.position.copyFrom(this.position);
        }
    }
}

abstract class PuppetLink {

    public nodeA: PuppetNode;
    public nodeB: PuppetNode;

    public mesh: BABYLON.Mesh;

    abstract getForceOn(node: PuppetNode): BABYLON.Vector3;

    public update(): void {
        if (this.mesh) {
            this.mesh.dispose();
        }
        this.mesh = BABYLON.MeshBuilder.CreateLines("line", { points: [ this.nodeA.position, this.nodeB.position ] });
    }
}

class PuppetSpring extends PuppetLink {

    public k: number = 10;
    public l0: number = 1;

    public static Connect(nodeA: PuppetNode, nodeB: PuppetNode, k: number = 10, l0?: number): PuppetSpring {
        let link = new PuppetSpring();
        if (isFinite(l0)) {
            link.l0 = l0;
        }
        link.nodeA = nodeA;
        link.nodeB = nodeB;
        link.nodeA.links.push(link);
        link.nodeB.links.push(link);
        return link;
    }

    public getForceOn(node: PuppetNode): BABYLON.Vector3 {
        let other: PuppetNode;
        if (node === this.nodeA) {
            other = this.nodeB;
        }
        if (node === this.nodeB) {
            other = this.nodeA;
        }
        if (!node) {
            console.warn("Requesting getForceOn on inadequate PuppetNode.");
            return BABYLON.Vector3.Zero();
        }
        let n = node.position.subtract(other.position);
        let l = n.length();
        n.scaleInPlace(1 / l);
        return n.scaleInPlace(this.l0 - l).scaleInPlace(this.k);
    }
}

class PuppetRope extends PuppetLink {

    public k: number = 400;
    public l0: number = 5;

    public static Connect(nodeA: PuppetNode, nodeB: PuppetNode): PuppetRope {
        let link = new PuppetRope();
        link.nodeA = nodeA;
        link.nodeB = nodeB;
        link.nodeA.links.push(link);
        link.nodeB.links.push(link);
        return link;
    }

    public getForceOn(node: PuppetNode): BABYLON.Vector3 {
        return BABYLON.Vector3.Zero();
    }
}
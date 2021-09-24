class PuppetTarget extends BABYLON.Mesh {

    public anchorFootRTarget: BABYLON.Mesh;
    public anchorFootLTarget: BABYLON.Mesh;

    constructor(
        public puppet: Puppet
    ) {
        super("target");

        this.anchorFootRTarget = BABYLON.MeshBuilder.CreateBox("anchorFootRTarget", { size: 0.05 });
        this.anchorFootRTarget.material = Main.redMaterial;
        this.anchorFootRTarget.position.copyFromFloats(0.5, 5, 0);
        this.anchorFootRTarget.parent = this;
        
        this.anchorFootLTarget = BABYLON.MeshBuilder.CreateBox("anchorFootLTarget", { size: 0.05 });
        this.anchorFootLTarget.material = Main.redMaterial;
        this.anchorFootLTarget.position.copyFromFloats(- 0.5, 5, 0);
        this.anchorFootLTarget.parent = this;
    }
}

class Puppet {

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
    
    public target: PuppetTarget;
    private _inputDirs: UniqueList<number> = new UniqueList<number>();
    private get _inputDir(): number {
        return this._inputDirs.getLast();
    }

    constructor() {
        this.target = new PuppetTarget(this);

        let body = new PuppetNode(false);
        let kneeR = new PuppetNode(false);
        kneeR.mass = 0.1;
        kneeR.gravity = () => {
            let n = new BABYLON.Vector3(0.5, 0, 1);
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(20 * kneeR.mass);
            return n;
        }
        let footR = new PuppetNode(false);
        footR.mass = 0.8;
        let kneeL = new PuppetNode(false);
        kneeL.mass = 0.1;
        kneeL.gravity = () => {
            let n = new BABYLON.Vector3(- 0.5, 0, 1);
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(20 * kneeL.mass);
            return n;
        }
        let footL = new PuppetNode(false);
        footL.mass = 0.8;
        let shoulder = new PuppetNode(false);
        let elbowR = new PuppetNode();
        elbowR.mass = 0.05;
        elbowR.gravity = () => {
            let n = new BABYLON.Vector3(1, -1, - 1);
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(3 * elbowR.mass);
            return n;
        }
        let elbowL = new PuppetNode();
        elbowL.mass = 0.05;
        elbowL.gravity = () => {
            let n = new BABYLON.Vector3(- 1, -1, - 1);
            this.target.getDirectionToRef(n, n);
            n.normalize().scaleInPlace(3 * elbowL.mass);
            return n;
        }
        let handR = new PuppetNode();
        let handL = new PuppetNode();

        this.links.push(PuppetSpring.Connect(body, kneeR));
        this.links.push(PuppetSpring.Connect(body, kneeL));
        this.links.push(PuppetSpring.Connect(kneeR, footR));
        this.links.push(PuppetSpring.Connect(kneeL, footL));
        let torso = PuppetSpring.Connect(body, shoulder);
        this.links.push(torso);
        this.links.push(PuppetSpring.Connect(shoulder, elbowR));
        this.links.push(PuppetSpring.Connect(shoulder, elbowL));
        this.links.push(PuppetSpring.Connect(elbowR, handR));
        this.links.push(PuppetSpring.Connect(elbowL, handL));

        this.anchorFootR = new PuppetNode();
        this.anchorFootR.position.copyFromFloats(0.5, 5, 0);
        this.links.push(PuppetRope.Connect(footR, this.anchorFootR));

        this.anchorFootL = new PuppetNode();
        this.anchorFootL.position.copyFromFloats(- 0.5, 5, 0);
        this.links.push(PuppetRope.Connect(footL, this.anchorFootL));

        this.anchorHead = new PuppetNode();
        this.anchorHead.position.copyFromFloats(0, 5, 0);
        let headRope = PuppetRope.Connect(shoulder, this.anchorHead);
        headRope.l0 = 1.5;
        this.links.push(headRope);

        this.anchorHandR = new PuppetNode();
        this.anchorHandR.position.copyFrom(this.anchorHead.position);
        this.anchorHandR.position.addInPlaceFromFloats(0.75, 0, 1);
        let handRRope = PuppetRope.Connect(handR, this.anchorHandR);
        handRRope.l0 = 3;
        this.links.push(handRRope);

        this.anchorHandL = new PuppetNode();
        this.anchorHandL.position.copyFrom(this.anchorHead.position);
        this.anchorHandL.position.addInPlaceFromFloats(- 0.75, 0, 1);
        let handLRope = PuppetRope.Connect(handL, this.anchorHandL);
        handLRope.l0 = 3;
        this.links.push(handLRope);

        this.nodes = [body, shoulder, kneeR, kneeL, footR, footL, elbowR, elbowL, handR, handL];

        this.bodyMesh = new BABYLON.Mesh("bodymesh");
        this.bodyMesh.material = Main.whiteMaterial;
        this.legRMesh = new BABYLON.Mesh("legRMesh");
        this.legRMesh.material = Main.whiteMaterial;
        this.legLMesh = new BABYLON.Mesh("legLMesh");
        this.legLMesh.material = Main.whiteMaterial;
        this.footRMesh = new BABYLON.Mesh("footRMesh");
        this.footRMesh.material = Main.whiteMaterial;
        this.footLMesh = new BABYLON.Mesh("footLMesh");
        this.footLMesh.material = Main.whiteMaterial;
        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/models/puppet.babylon",
            "",
            Main.Scene,
            (meshes) => {
                let body = meshes.find(m => { return m.name === "body"; }) as BABYLON.Mesh;
                let leg = meshes.find(m => { return m.name === "leg"; }) as BABYLON.Mesh;
                let foot = meshes.find(m => { return m.name === "foot"; }) as BABYLON.Mesh;
                if (body && leg && foot) {
                    let bodyMeshData = BABYLON.VertexData.ExtractFromMesh(body);
                    bodyMeshData.applyToMesh(this.bodyMesh);
                    let legMeshData = BABYLON.VertexData.ExtractFromMesh(leg);
                    let footMeshData = BABYLON.VertexData.ExtractFromMesh(foot);
                    legMeshData.applyToMesh(this.legRMesh);
                    legMeshData.applyToMesh(this.legLMesh);
                    footMeshData.applyToMesh(this.footRMesh);
                    footMeshData.applyToMesh(this.footLMesh);

                    body.dispose();
                    leg.dispose();
                    foot.dispose();
                }
            }
        );

        /*
        setTimeout(() => {
            this._moveLeg(0, new BABYLON.Vector3(0.5, 5, 1.5));
        }, 3000);
        setTimeout(() => {
            this._moveLeg(1, new BABYLON.Vector3(- 0.5, 5, 3));
        }, 6000);
        setTimeout(() => {
            this._moveLeg(0, new BABYLON.Vector3(0.5, 5, 4.5));
        }, 9000);
        setTimeout(() => {
            this._moveLeg(1, new BABYLON.Vector3(- 0.5, 5, 6));
        }, 12000);
        setTimeout(() => {
            this._moveLeg(0, new BABYLON.Vector3(0.5, 5, 6));
        }, 15000);
        */

        Main.Canvas.addEventListener("keydown", (e) => {
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

        Main.Canvas.addEventListener("keyup", (e) => {
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

    public t: number = 0;
    private _movingLegCount: number = 0;
    public update(): void {
        this.t += Main.Engine.getDeltaTime() / 1000;
        
        if (this._inputDirs.contains(0)) {
            this.target.position.addInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(1)) {
            this.target.position.subtractInPlace(this.target.forward.scale(2 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(2)) {
            this.target.position.subtractInPlace(this.target.right.scale(3 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(3)) {
            this.target.position.addInPlace(this.target.forward.scale(5 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(4)) {
            this.target.rotation.y -= 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
        }
        if (this._inputDirs.contains(5)) {
            this.target.rotation.y += 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
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
            this.links[i].update();
        }

        let bodyPos = this.nodes[0].position.clone();
        let shoulderPos = this.nodes[1].position.clone();
        let kneeRPos = this.nodes[2].position.clone();
        let kneeLPos = this.nodes[3].position.clone();
        let footRPos = this.nodes[4].position.clone();
        let footLPos = this.nodes[5].position.clone();
        
        let bodyKneeDist = Math.sqrt(0.35 * 0.35 + 1 * 1);
        for (let i = 0; i < 3; i++) {
            VMath.SetABDistanceInPlace(shoulderPos, bodyPos, 1.5, true);
            VMath.SetABDistanceInPlace(footRPos, kneeRPos, 1, true);
            VMath.SetABDistanceInPlace(footLPos, kneeLPos, 1, true);
            VMath.SetABDistanceInPlace(kneeRPos, bodyPos, bodyKneeDist);
            VMath.SetABDistanceInPlace(kneeLPos, bodyPos, bodyKneeDist);
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
                    t += Main.Engine.getDeltaTime() / 1000;
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
                    this.anchorHandR.position.addInPlace(r.scale(0.75)).addInPlace(f.scale(0.5 - dR));
                    let dL = BABYLON.Vector3.Dot(f, this.anchorFootL.position.subtract(this.anchorHead.position));
                    this.anchorHandL.position.copyFrom(this.anchorHead.position);
                    this.anchorHandL.position.addInPlace(r.scale(- 0.75)).addInPlace(f.scale(0.5 - dL));
                    
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

class PuppetNode {

    public mass: number = 0.1;
    public position: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public velocity: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    public links: PuppetLink[] = [];

    public mesh: BABYLON.Mesh;

    public gravity = () => {
        return new BABYLON.Vector3(0, - 9.8 * this.mass, 0);
    }

    constructor(
        public showMesh: boolean = true
    ) {
        this.position.copyFromFloats(
            - 1 + Math.random() * 2,
            - 1 + Math.random() * 2 + 2,
            - 1 + Math.random() * 2
        );

        if (this.showMesh) {
            this.mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 0.2 });
        }
    }

    public update(): void {
        let dt = Main.Engine.getDeltaTime() / 1000;
        let force = this.gravity();
        for (let i = 0; i < this.links.length; i++) {
            if (!(this.links[i] instanceof PuppetRope)) {
                force.addInPlace(this.links[i].getForceOn(this));
            }
        }
        if (this.position.y < 0.1) {
            force.x -= this.velocity.x * 0.5;
            force.y -= this.velocity.y * 0.08;
            force.z -= this.velocity.z * 0.5;
        }
        else {
            force.x -= this.velocity.x * 0.08;
            force.y -= this.velocity.y * 0.08;
            force.z -= this.velocity.z * 0.08;
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

        if (this.showMesh) {
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

    public static Connect(nodeA: PuppetNode, nodeB: PuppetNode): PuppetSpring {
        let link = new PuppetSpring();
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
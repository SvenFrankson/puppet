class Target extends BABYLON.Mesh {

    public targets: BABYLON.Mesh[] = [];

    constructor(
        public crawler: Crawler
    ) {
        super("target");

        let a1 = 45 * Math.PI / 180;
        let cosA1 = Math.cos(a1);
        let sinA1 = Math.sin(a1);
        let a2 = 15 * Math.PI / 180;
        let cosA2 = Math.cos(a2);
        let sinA2 = Math.sin(a2);

        let positions: BABYLON.Vector3[] = [
            new BABYLON.Vector3(- 5 * cosA1, 0, 5 * sinA1),
            new BABYLON.Vector3(- 5 * cosA2, 0, 5 * sinA2),
            new BABYLON.Vector3(- 5 * cosA2, 0, - 5 * sinA2),
            new BABYLON.Vector3(- 5 * cosA1, 0, - 5 * sinA1),
            new BABYLON.Vector3(5 * cosA1, 0, - 5 * sinA1),
            new BABYLON.Vector3(5 * cosA2, 0, - 5 * sinA2),
            new BABYLON.Vector3(5 * cosA2, 0, 5 * sinA2),
            new BABYLON.Vector3(5 * cosA1, 0, 5 * sinA1),
        ]
        for (let i = 0; i < crawler.legCount; i++) {
            //let target = new BABYLON.Mesh("target-" + i);
            let target = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            target.material = Main.redMaterial;
            target.position.copyFrom(positions[i]);
            target.parent = this;
            this.targets[i] = target;
        }
    }
}

class Crawler {

    public cameraTarget: BABYLON.Mesh;

    public legCount: number = 8;

    public feet: BABYLON.Mesh[] = [];

    public legs: BABYLON.Mesh[] = [];
    public lowerLegs: BABYLON.Mesh[] = [];
    public hipJoints: BABYLON.Mesh[] = [];
    public body: BABYLON.Mesh;

    public target: Target;
    private _inputDirs: UniqueList<number> = new UniqueList<number>();
    private get _inputDir(): number {
        return this._inputDirs.getLast();
    }

    constructor() {
        this.target = new Target(this);

        this.body = BABYLON.MeshBuilder.CreateSphere("body", { diameterX: 1, diameterY: 0.5, diameterZ: 1 }, Main.Scene);

        this.cameraTarget = new BABYLON.Mesh("camera-target");
        this.cameraTarget.parent = this.body;
        this.cameraTarget.position.copyFromFloats(5, 25, - 25);
        this.cameraTarget.rotation.x = Math.PI / 4;

        let a1 = 30 * Math.PI / 180;
        let cosA1 = Math.cos(a1);
        let sinA1 = Math.sin(a1);
        let a2 = 10 * Math.PI / 180;
        let cosA2 = Math.cos(a2);
        let sinA2 = Math.sin(a2);

        let positions: BABYLON.Vector3[] = [
            new BABYLON.Vector3(- 1 * cosA1, 0, 1 * sinA1),
            new BABYLON.Vector3(- 1 * cosA2, 0, 1 * sinA2),
            new BABYLON.Vector3(- 1 * cosA2, 0, - 1 * sinA2),
            new BABYLON.Vector3(- 1 * cosA1, 0, - 1 * sinA1),
            new BABYLON.Vector3(1 * cosA1, 0, - 1 * sinA1),
            new BABYLON.Vector3(1 * cosA2, 0, - 1 * sinA2),
            new BABYLON.Vector3(1 * cosA2, 0, 1 * sinA2),
            new BABYLON.Vector3(1 * cosA1, 0, 1 * sinA1),
        ]
        for (let i = 0; i < this.legCount; i++) {
            let hipJoint = BABYLON.MeshBuilder.CreateBox("hipJoint-" + i, { size: 0.1 });
            hipJoint.material = Main.greenMaterial;
            hipJoint.position.copyFrom(positions[i]);
            hipJoint.parent = this.body;
            this.hipJoints[i] = hipJoint;
        }

        for (let i = 0; i < this.legCount; i++) {
            let foot = BABYLON.MeshBuilder.CreateBox("target-" + i, { size: 0.05 });
            foot.material = Main.blueMaterial;
            foot.position.copyFrom(this.target.targets[i].absolutePosition);
            this.feet[i] = foot;
        }

        for (let i = 0; i < this.legCount; i++) {
            let leg = new BABYLON.Mesh("leg-" + i);
            this.legs[i] = leg;
            let lowerLeg = new BABYLON.Mesh("lower-leg-" + i);
            this.lowerLegs[i] = lowerLeg;
        }

        BABYLON.SceneLoader.ImportMesh(
            "",
            "assets/models/crawler.babylon",
            "",
            Main.Scene,
            (meshes) => {
                let body = meshes.find(m => { return m.name === "body"; }) as BABYLON.Mesh;
                let leg = meshes.find(m => { return m.name === "leg"; }) as BABYLON.Mesh;
                let lowerLeg = meshes.find(m => { return m.name === "lower-leg"; }) as BABYLON.Mesh;
                if (body && leg && lowerLeg) {
                    let bodyMesh = BABYLON.VertexData.ExtractFromMesh(body);
                    bodyMesh.applyToMesh(this.body);
                    let legMesh = BABYLON.VertexData.ExtractFromMesh(leg);
                    let lowerLegMesh = BABYLON.VertexData.ExtractFromMesh(lowerLeg);

                    for (let i = 0; i < this.legCount; i++) {
                        legMesh.applyToMesh(this.legs[i]);
                        lowerLegMesh.applyToMesh(this.lowerLegs[i]);
                    }
                    body.dispose();
                    leg.dispose();
                    lowerLeg.dispose();
                }
            }
        );

        Main.Scene.onBeforeRenderObservable.add(this._update);

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

    private _movingLegCount: number = 0;
    private _movingLegs: UniqueList<number> = new UniqueList<number>();

    private async _moveLeg(legIndex: number, target: BABYLON.Vector3): Promise<void> {
        return new Promise<void>(
            resolve => {
                this._movingLegs.push(legIndex);
                let origin = this.feet[legIndex].position.clone();
                let i = 0;
                let count = 10;
                let step = () => {
                    i++;
                    this._movingLegCount -= 1 / count;
                    this.feet[legIndex].position.copyFrom(
                        origin.scale(1 - i / count).add(target.scale(i / count))
                    );
                    this.feet[legIndex].position.y = 0.25 * Math.sin(Math.PI * i / count);
                    if (i < count) {
                        requestAnimationFrame(step);
                    }
                    else {
                        this._movingLegs.remove(legIndex);
                        resolve();
                    }
                }
                step();
            }
        )
    }

    private _update = () => {
        if (this._inputDirs.contains(0)) {
            this.target.position.addInPlace(this.target.right.scale( 5 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(1)) {
            this.target.position.subtractInPlace(this.target.forward.scale( 5 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(2)) {
            this.target.position.subtractInPlace(this.target.right.scale( 5 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(3)) {
            this.target.position.addInPlace(this.target.forward.scale( 5 * Main.Engine.getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(4)) {
            this.target.rotation.y -= 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
        }
        if (this._inputDirs.contains(5)) {
            this.target.rotation.y += 0.5 * Math.PI * Main.Engine.getDeltaTime() / 1000;
        }

        this.body.position.copyFrom(this.feet[0].position);
        for (let i = 1; i < this.legCount; i++) {
            this.body.position.addInPlace(this.feet[i].position);
        }
        this.body.position.scaleInPlace(1 / this.legCount);
        this.body.position.y += 1.5;
        
        let left = BABYLON.Vector3.Zero();
        for (let i = 0; i < 4; i++) {
            left.addInPlace(this.feet[i].absolutePosition);
        }
        left.scaleInPlace(0.25);

        let right = BABYLON.Vector3.Zero();
        for (let i = 4; i < 8; i++) {
            right.addInPlace(this.feet[i].absolutePosition);
        }
        right.scaleInPlace(0.25);

        let rightDir = right.subtract(left).normalize();

        let forward = BABYLON.Vector3.Cross(rightDir, BABYLON.Axis.Y);

        this.body.rotationQuaternion = BABYLON.Quaternion.RotationQuaternionFromAxis(rightDir, BABYLON.Axis.Y, forward);

        for (let i = 0; i < this.legCount; i++) {
            let knee = this.hipJoints[i].absolutePosition.add(this.feet[i].absolutePosition).scale(0.5);
            knee.y += 1;
            for (let j = 0; j < 3; j++) {
                let legN = knee.subtract(this.hipJoints[i].absolutePosition).normalize();
                knee = this.hipJoints[i].absolutePosition.add(legN.scale(3));
                let lowerLegN = knee.subtract(this.feet[i].absolutePosition).normalize();
                knee = this.feet[i].absolutePosition.add(lowerLegN.scale(3));
            }

            this.legs[i].position = this.hipJoints[i].absolutePosition;
            this.legs[i].lookAt(knee);
            this.lowerLegs[i].position = knee;
            this.lowerLegs[i].lookAt(this.feet[i].absolutePosition);
        }

        if (this._movingLegCount < 0.5) {
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
                this._moveLeg(index, this.target.targets[index].absolutePosition); 
            }
        }
    }
}
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
            let target = new BABYLON.Mesh("target-" + i);
            target.position.x = positions[i].x;
            target.position.y = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
        }
    }
}

class Walker extends GameObject {

    public legCount: number = 2;

    public body: Sprite;
    public arms: Sprite[] = [];
    public feet: Sprite[] = [];

    public target: WalkerTarget;
    private _inputDirs: UniqueList<number> = new UniqueList<number>();
    private get _inputDir(): number {
        return this._inputDirs.getLast();
    }

    constructor(
        main: Main
    ) {
        super(main);

        this.target = new WalkerTarget(this);

        let robotBody = new Sprite("robot-body", "assets/robot_body_2.png", this.main.scene);
        robotBody.height = 2;
		robotBody.position.x = 5;
		robotBody.position.y = 5;
        
        this.body = robotBody;
		
		let robotArm_L = new Sprite("robot-arm_L", "assets/robot_arm_L.png", this.main.scene);
        robotArm_L.height = 3;
		robotArm_L.setPivotPoint((new BABYLON.Vector3(0.48, - 0.43, 0)));
		robotArm_L.position.x = - 1.1;
		robotArm_L.position.y = 0.7;
		robotArm_L.position.z = - 0.1;
		robotArm_L.parent = robotBody

		let robotArm_R = new Sprite("robot-arm_R", "assets/robot_arm_R.png", this.main.scene);
        robotArm_R.height = 3;
		robotArm_R.setPivotPoint((new BABYLON.Vector3(- 0.48, - 0.43, 0)));
		robotArm_R.position.x = 1.1;
		robotArm_R.position.y = 0.7;
		robotArm_R.position.z = - 0.1;
		robotArm_R.parent = robotBody

        let robotFoot_L = new Sprite("robot-foot_L", "assets/robot_foot_L.png", this.main.scene);
        robotFoot_L.height = 1;
		robotFoot_L.position.x = - 1.1;
		robotFoot_L.position.y = 0;
		robotFoot_L.position.z = 0.1;
		robotFoot_L.rotation.z = 0.3;

		let robotFoot_R = new Sprite("robot-foot_R", "assets/robot_foot_R.png", this.main.scene);
        robotFoot_R.height = 1;
		robotFoot_R.position.x = 1.1;
		robotFoot_R.position.y = 0;
		robotFoot_R.position.z = 0.1;
		robotFoot_R.rotation.z = - 0.3;

        this.feet = [robotFoot_L, robotFoot_R];
        this.arms = [robotArm_L, robotArm_R];

        this.main.scene.onBeforeRenderObservable.add(this._update);

        this.main.canvas.addEventListener("keydown", (e) => {
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

        this.main.canvas.addEventListener("keyup", (e) => {
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

    public dispose(): void {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.body.dispose();
        this.arms.forEach(a => {
            a.dispose();
        })
        this.feet.forEach(f => {
            f.dispose();
        })
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
                    t += this.main.scene.getEngine().getDeltaTime() / 1000;
                    let d = t / duration;
                    d = d * d;
                    d = Math.min(d, 1);
                    this.feet[legIndex].position.copyFrom(
                        origin.scale(1 - d).add(target.scale(d))
                    );
                    this.feet[legIndex].height = 1 + 3 * Math.sin(Math.PI * d);
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
        this._bodyT += this._bodySpeed * this.main.scene.getEngine().getDeltaTime() / 1000;
        this._armT += this._armSpeed * this.main.scene.getEngine().getDeltaTime() / 1000;
        this._bodySpeed = 1;
        this._armSpeed = 1;
        if (this._inputDirs.contains(0)) {
            this.target.position.addInPlace(this.target.right.scale(2 * this.main.scene.getEngine().getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(1)) {
            this.target.position.subtractInPlace(this.target.up.scale(1 * this.main.scene.getEngine().getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(2)) {
            this.target.position.subtractInPlace(this.target.right.scale(2 * this.main.scene.getEngine().getDeltaTime() / 1000));
        }
        if (this._inputDirs.contains(3)) {
            this.target.position.addInPlace(this.target.up.scale(3 * this.main.scene.getEngine().getDeltaTime() / 1000));
            this._bodySpeed = 3;
            this._armSpeed = 5;
        }
        if (this._inputDirs.contains(4)) {
            this.target.rotation.z += 0.4 * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000;
        }
        if (this._inputDirs.contains(5)) {
            this.target.rotation.z -= 0.4 * Math.PI * this.main.scene.getEngine().getDeltaTime() / 1000;
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
            if (dist > 0.1) {
                this._movingLegCount++;
                this._moveLeg(index, this.target.targets[index].absolutePosition, this.target.rotation.z); 
            }
        }
    }
}
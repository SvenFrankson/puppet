class WalkerTarget extends BABYLON.Mesh {

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
        this.walker.feet[0].posX = x + 0.1;
        this.walker.feet[1].posX = x - 0.1;
    }

    public get posY(): number {
        return this.position.z;
    }

    public set posY(y: number) {
        this.position.z = y;
        this.walker.feet[0].posY = y + 0.1;
        this.walker.feet[1].posY = y - 0.1;
    }

    public get rot(): number {
        return this.rotation.y;
    }
    public set rot(r: number) {
        this.rotation.y = r;
    }

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
            target.position.z = positions[i].y;
            target.parent = this;
            this.targets[i] = target;
        }
    }
}

class Walker extends GameObject {

    public legCount: number = 2;

    public arms: Sprite[] = [];
    public feet: Sprite[] = [];

    public target: WalkerTarget;
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

    constructor(
        main: Main
    ) {
        super(main);

        this.target = new WalkerTarget(this);

        let robotBody = new Sprite("robot-body", "assets/robot_body_2.png", this.main.scene);
        robotBody.height = 2;
		robotBody.position.x = 5;
		robotBody.position.z = 5;
		robotBody.position.y = Sprite.QUAD_Y + Sprite.LEVEL_STEP;
        
        this.sprite = robotBody;
		
		let robotArm_L = new Sprite("robot-arm_L", "assets/robot_arm_L.png", this.main.scene);
        robotArm_L.height = 3;
		robotArm_L.setPivotPoint((new BABYLON.Vector3(0.48, - 0.43, 0)));
		robotArm_L.position.x = - 1.1;
		robotArm_L.position.z = 0.7;
		robotArm_L.position.y = Sprite.LEVEL_STEP;
		robotArm_L.parent = robotBody

		let robotArm_R = new Sprite("robot-arm_R", "assets/robot_arm_R.png", this.main.scene);
        robotArm_R.height = 3;
		robotArm_R.setPivotPoint((new BABYLON.Vector3(- 0.48, - 0.43, 0)));
		robotArm_R.position.x = 1.1;
		robotArm_R.position.z = 0.7;
		robotArm_R.position.y = Sprite.LEVEL_STEP;
		robotArm_R.parent = robotBody

        let robotFoot_L = new Sprite("robot-foot_L", "assets/robot_foot_L.png", this.main.scene);
        robotFoot_L.height = 1;
		robotFoot_L.position.x = - 1.1;
		robotFoot_L.position.z = 0;
		robotFoot_L.position.y = Sprite.QUAD_Y;
		robotFoot_L.rotation.y = 0.3;

		let robotFoot_R = new Sprite("robot-foot_R", "assets/robot_foot_R.png", this.main.scene);
        robotFoot_R.height = 1;
		robotFoot_R.position.x = 1.1;
		robotFoot_R.position.z = 0;
		robotFoot_L.position.y = Sprite.QUAD_Y;
		robotFoot_R.rotation.y = - 0.3;

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

        this.main.navGraphManager.onObstacleListUpdated.add(this._updatePath);
    }

    public dispose(): void {
        super.dispose();
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.sprite.dispose();
        this.arms.forEach(a => {
            a.dispose();
        })
        this.feet.forEach(f => {
            f.dispose();
        })
        this.main.navGraphManager.onObstacleListUpdated.removeCallback(this._updatePath);
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
                    this.feet[legIndex].position.y = Sprite.QUAD_Y;;
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

    private _bodyT: number = 0;
    private _bodySpeed: number = 0.5;
    private _armT: number = 0;
    private _armSpeed: number = 1;
    private _update = () => {
        this._bodyT += this._bodySpeed * this.main.scene.getEngine().getDeltaTime() / 1000;
        this._armT += this._armSpeed * this.main.scene.getEngine().getDeltaTime() / 1000;
        this._bodySpeed = 1;
        this._armSpeed = 1;

        let forwardSpeed: number = 0;
        if (this._inputForwardAxis > 0) {
            forwardSpeed = 1 * this._inputForwardAxis;
            this._bodySpeed = 1 + 2 * this._inputForwardAxis;
            this._armSpeed = 1 + 4 * this._inputForwardAxis;
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
            this._bodySpeed = 3;
            this._armSpeed = 5;
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

        this.sprite.position.copyFrom(this.feet[0].position);
        for (let i = 1; i < this.legCount; i++) {
            this.sprite.position.addInPlace(this.feet[i].position);
        }
        this.sprite.position.scaleInPlace(1 / this.legCount);
        this.sprite.position.x += Math.cos(1 * this._bodyT * Math.PI) * 0.1;
        this.sprite.position.z += Math.cos(1.1 * this._bodyT * Math.PI) * 0.1;
        this.sprite.position.y = Sprite.QUAD_Y + Sprite.LEVEL_STEP;

        this.arms[0].rotation.y = Math.cos(1 * this._armT * Math.PI) * 0.15 - 0.3;
        this.arms[1].rotation.y = Math.cos(1.1 * this._armT * Math.PI) * 0.15 + 0.3;
        
        let rightDir = new BABYLON.Vector2(
            this.feet[1].absolutePosition.x - this.feet[0].absolutePosition.x,
            this.feet[1].absolutePosition.z - this.feet[0].absolutePosition.z,
        )
        rightDir.normalize();

        let a = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), rightDir);
        this.sprite.rotation.y = Math2D.LerpFromToCircular(- a, this.target.rotation.y, 0.5);

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
                this._moveLeg(index, this.target.targets[index].absolutePosition, this.target.rotation.y); 
            }
        }
        if (!this.currentPath || this.currentPath.length === 0) {
            this._updatePath();
        }
        this.moveOnPath();
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
            this.dispose();
        }
    }
}
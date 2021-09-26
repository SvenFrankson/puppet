class PuppetControler {

    public inputDirs: UniqueList<number> = new UniqueList<number>();

    constructor(public puppet: Puppet) {

    }

    public initialize(): void {

    }
}

class FlightPlanPuppetControler extends PuppetControler {

    public flightPlan: BABYLON.Vector2[] = [];
    public waypointIndex: number = 0;

    public initialize(): void {
        Main.Scene.onBeforeRenderObservable.add(this.update);
    }

    public update = () => {
        let target = this.flightPlan[this.waypointIndex];

        let d = new BABYLON.Vector2(
            this.puppet.target.position.x - target.x,
            this.puppet.target.position.z - target.y
        );

        if (d.length() < 1) {
            this.waypointIndex = (this.waypointIndex + 1) % this.flightPlan.length;
            return;
        }

        d.normalize();
        let f = new BABYLON.Vector2(
            this.puppet.target.forward.x,
            this.puppet.target.forward.z
        );

        let cross = d.x * f.y - d.y * f.x;
        if (cross < 0) {
            this.inputDirs.push(5);
            this.inputDirs.remove(4);
        }
        else if (cross > 0) {
            this.inputDirs.remove(5);
            this.inputDirs.push(4);
        }
        this.inputDirs.push(3);
    }
}

class WalkAroundPuppetControler extends PuppetControler {

    public target: BABYLON.Vector2 = BABYLON.Vector2.Zero();

    public initialize(): void {
        Main.Scene.onBeforeRenderObservable.add(this.update);
    }

    public update = () => {
        let d = new BABYLON.Vector2(
            this.puppet.target.position.x - this.target.x,
            this.puppet.target.position.z - this.target.y
        );

        if (d.length() < 1) {
            this.target.x = - 20 + 40 * Math.random();
            this.target.y = - 20 + 40 * Math.random();

            let debug = BABYLON.MeshBuilder.CreateBox("debug", { size: 1 });
            debug.position.x = this.target.x;
            debug.position.z = this.target.y;
        }

        d.normalize();
        let f = new BABYLON.Vector2(
            this.puppet.target.forward.x,
            this.puppet.target.forward.z
        );

        let cross = d.x * f.y - d.y * f.x;
        if (cross < 0) {
            this.inputDirs.push(5);
            this.inputDirs.remove(4);
        }
        else if (cross > 0) {
            this.inputDirs.remove(5);
            this.inputDirs.push(4);
        }
        this.inputDirs.push(3);
    }
}

class KeyBoardPuppetControler extends PuppetControler {

    public initialize(): void {
        Main.Canvas.addEventListener("keydown", (e) => {
            if (e.code === "KeyD") {
                this.inputDirs.push(0);
            }
            if (e.code === "KeyS") {
                this.inputDirs.push(1);
            }
            if (e.code === "KeyA") {
                this.inputDirs.push(2);
            }
            if (e.code === "KeyW") {
                this.inputDirs.push(3);
            }
            if (e.code === "KeyQ") {
                this.inputDirs.push(4);
            }
            if (e.code === "KeyE") {
                this.inputDirs.push(5);
            }
        });

        Main.Canvas.addEventListener("keyup", (e) => {
            if (e.code === "KeyD") {
                this.inputDirs.remove(0);
            }
            if (e.code === "KeyS") {
                this.inputDirs.remove(1);
            }
            if (e.code === "KeyA") {
                this.inputDirs.remove(2);
            }
            if (e.code === "KeyW") {
                this.inputDirs.remove(3);
            }
            if (e.code === "KeyQ") {
                this.inputDirs.remove(4);
            }
            if (e.code === "KeyE") {
                this.inputDirs.remove(5);
            }
        });
    }
}
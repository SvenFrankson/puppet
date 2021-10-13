class PuppetParameters {

    public torsoSpringK: number = 10;
    
    public bodyGravity: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, - 1);
    public bodyFluidC: number = 0.08;

    public shoulderFluidC: number = 0.08;

    public upperLegSpringK: number = 10;
    public lowerLegSpringK: number = 10;

    public kneeMass: number = 0.1;
    public kneeRGravity: BABYLON.Vector3 = new BABYLON.Vector3(0.5, 0, 1);
    public kneeGravityFactor: number = 20;
    public kneeFluidC: number = 0.08;

    public footMass: number = 0.8;
    public footTargetDistance: number = 0.5;
    public footFluidC: number = 0.08;
    public footGroundC: number = 0.5;

    public armSpringK: number = 10;
    public foreArmSpringK: number = 10;

    public elbowMass: number = 0.05;
    public elbowRGravity: BABYLON.Vector3 = new BABYLON.Vector3(1, - 0.5, - 1);
    public elbowGravityFactor: number = 5;
    public elbowFluidC: number = 0.08;
    
    public handMass: number = 0.05;
    public handFluidC: number = 0.08;
    public handAnchorPosition: BABYLON.Vector3 = new BABYLON.Vector3(0.75, -0.5, 0);

    public MakeChild(p1: PuppetParameters, p2: PuppetParameters, percentMutation: number = 0.3, mutationAmplitude: number = 0.3): PuppetParameters {
        let child = new PuppetParameters();
        Object.keys(child).forEach((k) => {
            if (Math.random() < percentMutation) {
                let v = child[k];
                let v1 = p1[k];
                let v2 = p2[k];
                if (v instanceof BABYLON.Vector3) {
                    v.copyFrom(v1).addInPlace(v2).scaleInPlace(0.5);
                    let l = v.length();
                    let r = new BABYLON.Vector3(- 1 + 2 * Math.random(), - 1 + 2 * Math.random(), - 1 + 2 * Math.random());
                    r.normalize();
                    r.scaleInPlace(l);
                    r.scaleInPlace(0.5 + Math.random());
                    r.scaleInPlace(mutationAmplitude);
                    child[k].addInPlace(r);
                }
                if (typeof(v) === "number") {
                    child[k] = (v1 + v2) * 0.5 * (1 - mutationAmplitude + Math.random() * 2 * mutationAmplitude);
                }
            }
        });
        return child;
    }

    public randomize(percentMutation: number = 0.3, mutationAmplitude: number = 0.3): void {
        Object.keys(this).forEach((k) => {
            if (Math.random() < percentMutation) {
                let v = this[k];
                if (v instanceof BABYLON.Vector3) {
                    let l = v.length();
                    let r = new BABYLON.Vector3(- 1 + 2 * Math.random(), - 1 + 2 * Math.random(), - 1 + 2 * Math.random());
                    r.normalize();
                    r.scaleInPlace(l);
                    r.scaleInPlace(0.5 + Math.random());
                    r.scaleInPlace(mutationAmplitude);
                    this[k].addInPlace(r);
                }
                if (typeof(v) === "number") {
                    this[k] = v * (1 - mutationAmplitude + Math.random() * 2 * mutationAmplitude);
                }
            }
        });
    }

    public serialize(): any {
        let data = {};
        Object.keys(this).forEach((k) => {
            let v = this[k];
            if (v instanceof BABYLON.Vector3) {
                data[k] = { x: v.x, y: v.y, z: v.z };
            }
            if (typeof(v) === "number") {
                data[k] = v;
            }
        });
        return data;
    }

    public deserialize(data: any): void {
        Object.keys(this).forEach((k) => {
            let v = this[k];
            if (v instanceof BABYLON.Vector3) {
                v.x = data[k].x;
                v.y = data[k].y;
                v.z = data[k].z;
            }
            if (typeof(v) === "number") {
                this[k] = data[k];
            }
        });
    }

    public save(name: string): void {
        let data = this.serialize();
        localStorage.setItem(name, JSON.stringify(data));
    }

    public load(name: string): void {
        let data = localStorage.getItem(name);
        if (data) {
            this.deserialize(JSON.parse(data));
        }
    }
}
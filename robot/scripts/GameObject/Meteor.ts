class Meteor extends BABYLON.Mesh {

    public landDustParticleSystem: BABYLON.ParticleSystem;
    public landFlashParticleSystem: BABYLON.ParticleSystem;
    public landFlashes: FlashParticle[] = [];
    public destination: BABYLON.Vector3;

    constructor(
        public radius: number,
        destination2D: BABYLON.Vector2,
        public main: Main,
        public color?: BABYLON.Color3,
        public onLandCallback?: () => void
    ) {
        super("meteor", main.scene);
        this.destination = new BABYLON.Vector3(
            destination2D.x,
            this.main.ground.getHeightAt(destination2D),
            destination2D.y
        );
        this.position.copyFrom(this.destination);
        this.position.x += - 10 + 20 * Math.random();
        this.position.y += 50;
        this.position.z += - 10 + 20 * Math.random();

        this.landDustParticleSystem = new BABYLON.ParticleSystem("land-dust", 70, this.main.scene);
        this.landDustParticleSystem.particleTexture = new BABYLON.Texture("assets/dust.png", this.main.scene);
        this.landDustParticleSystem.targetStopDuration = 1;

        this.landDustParticleSystem.maxLifeTime = 0.75;
        this.landDustParticleSystem.maxLifeTime = 1.5;

        this.landDustParticleSystem.minAngularSpeed = Math.PI / 4;
        this.landDustParticleSystem.maxAngularSpeed = Math.PI;

        this.landDustParticleSystem.addSizeGradient(0, 0.4 * this.radius);
        this.landDustParticleSystem.addSizeGradient(0.05, 2 * this.radius);
        this.landDustParticleSystem.addSizeGradient(1, 0.1 * this.radius);

        this.landDustParticleSystem.color1 = new BABYLON.Color4(1, 1, 1, 1);
        this.landDustParticleSystem.color2 = new BABYLON.Color4(1, 1, 1, 1);

        this.landDustParticleSystem.emitRate = 1000;

        this.landDustParticleSystem.startDirectionFunction = (worldMatrix: BABYLON.Matrix, directionToUpdate: BABYLON.Vector3, particle: BABYLON.Particle) => {
            directionToUpdate.copyFromFloats(
                - 0.5 + Math.random(),
                0.4 * Math.random(),
                - 0.5 + Math.random()
            ).scaleInPlace(4 * this.radius);
        }

        /*
        this.landFlashParticleSystem = new BABYLON.ParticleSystem("land-flash", 100, this.main.scene);
        this.landFlashParticleSystem.particleTexture = new BABYLON.Texture("assets/bang.png", this.main.scene);
        this.landFlashParticleSystem.targetStopDuration = 0.1;

        this.landFlashParticleSystem.isBillboardBased = true;

        this.landFlashParticleSystem.minLifeTime = 0.3 * 0.5;
        this.landFlashParticleSystem.maxLifeTime = 0.3 * 0.5;

        this.landFlashParticleSystem.minAngularSpeed = 0;
        this.landFlashParticleSystem.maxAngularSpeed = 0;

        this.landFlashParticleSystem.minSize = 0.2;
        this.landFlashParticleSystem.maxSize = 0.4;

        this.landFlashParticleSystem.addColorGradient(0, new BABYLON.Color4(1, 0, 0, 1));
        this.landFlashParticleSystem.addColorGradient(1, new BABYLON.Color4(1, 0, 0, 1));

        this.landFlashParticleSystem.emitRate = 1000;

        this.landFlashParticleSystem.startDirectionFunction = (worldMatrix: BABYLON.Matrix, directionToUpdate: BABYLON.Vector3, particle: BABYLON.Particle) => {
            let alpha = Math.random() * Math.PI * 2;
            let cosa = Math.cos(alpha);
            let sina = Math.sin(alpha);
            let beta = Math.random() * Math.PI / 8;
            let cosb = Math.cos(beta);
            let sinb = Math.sin(beta);
            directionToUpdate.copyFromFloats(
                cosa * cosb,
                sinb,
                sina * cosb
            ).scaleInPlace((12 + Math.random() * 12) * this.radius);
        }
        */
        for (let i = 0; i < 20; i++) {
            this.landFlashes.push(new FlashParticle("pew", this.main.scene, 5 + 2 * Math.random(), 0.15 + 0.1 * Math.random()));
        }
    }

    public instantiate(): void {
        BABYLON.VertexData.CreateSphere({ diameter: 2 * this.radius }).applyToMesh(this);
        let meteorMaterial = new ToonMaterial("meteor-material", false, this.main.scene);
        if (this.color) {
            meteorMaterial.setColor(this.color);
        }
        this.material = meteorMaterial;

        this.main.scene.onBeforeRenderObservable.add(this._update);
    }

    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        this.main.scene.onBeforeRenderObservable.removeCallback(this._update);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public _update = () => {
        let dt = this.main.engine.getDeltaTime() / 1000;
        let dv = this.destination.subtract(this.position).normalize().scale(120 * dt);
        if (dv.y < 0) {
            this.position.addInPlace(dv);
        }
        else {
            if (this.onLandCallback) {
                this.onLandCallback();
            }
            this.landDustParticleSystem.emitter = this.destination.add(new BABYLON.Vector3(0, 0.5, 0));
            this.landDustParticleSystem.createSphereEmitter(1, 0.5);
            this.landDustParticleSystem.start();
            //this.landFlashParticleSystem.emitter = this.destination.add(new BABYLON.Vector3(0, 0.3, 0));
            //this.landFlashParticleSystem.start();
            this.dispose();
            for (let i = 0; i < 20; i++) {
                let flashParticle = this.landFlashes[i];
                let alpha = Math.random() * Math.PI * 2;
                let cosa = Math.cos(alpha);
                let sina = Math.sin(alpha);
                let beta = Math.random() * Math.PI / 4;
                let cosb = Math.cos(beta);
                let sinb = Math.sin(beta);
                let dir = new BABYLON.Vector3(
                    cosa * cosb,
                    sinb,
                    sina * cosb
                )
                setTimeout(
                    () => {
                        flashParticle.flash(this.destination.add(new BABYLON.Vector3(cosa, 0, sina)), dir);
                    },
                    Math.random() * 60
                )
            }
        }
    }
}
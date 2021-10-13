class CrawlerCamera extends BABYLON.FreeCamera {

    public crawler: Crawler | Walker;

    constructor() {
        super("crawler-camera", BABYLON.Vector3.Zero(), Main.Scene);
        this.rotationQuaternion = BABYLON.Quaternion.Identity();
    }

    public attach(crawler: Crawler | Walker): void {
        this.crawler = crawler;
        Main.Scene.onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        this.position.scaleInPlace(0.95).addInPlace(this.crawler.cameraTarget.absolutePosition.scale(0.05));
        let targetQuaternion = BABYLON.Quaternion.FromEulerVector(this.crawler.target.rotation).multiplyInPlace(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, Math.PI / 4))
        BABYLON.Quaternion.SlerpToRef(this.rotationQuaternion, targetQuaternion, 0.05, this.rotationQuaternion);
    }
}
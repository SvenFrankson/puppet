enum CameraRadiusMode {
    Cover,
    Contain
}

class Camera {

    public position: Vec2;
    public radius: number = 10;
    public radiusMode: CameraRadiusMode = CameraRadiusMode.Cover;

    constructor(
        public scene: Scene
    ) {
        this.position = new Vec2();
    }
}
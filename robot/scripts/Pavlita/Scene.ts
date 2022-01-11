class Scene {

    public nodes: UniqueList<TransformNode>;
    public cameras: UniqueList<Camera>;

    constructor(
        public engine: Engine
    ) {
        this.nodes = new UniqueList<TransformNode>();
        this.cameras = new UniqueList<Camera>();
    }

    public update(dt: number): void {

    }
}
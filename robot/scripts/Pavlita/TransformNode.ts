class TransformNode {

    public position: Vec2 = new Vec2();
    public absolutePosition: Vec2 = new Vec2();
    
    public rotation: number = 0;
    public absoluteRotation: number = 0;

    public parent: TransformNode;

    constructor(
        public name: string,
        public scene: Scene
    ) {
        
    }
}
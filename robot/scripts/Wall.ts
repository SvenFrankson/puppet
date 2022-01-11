class WallNode {

    public sprite: Sprite;
    public top: Sprite;

    constructor(
        public name: string,
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        this.sprite = new Sprite("wall", "assets/wall_node_base.png", this.scene);
        this.sprite.position.z = 0;
        this.sprite.height = 1;
        
        this.top = new Sprite("wall-top", "assets/wall_top.png", this.scene);
        this.top.position.z = -0.2;
        this.top.parent = this.sprite;
        this.top.height = 5;
    }
}

class Wall {
    public sprite: Sprite;

    constructor(
        public node1: WallNode,
        public node2: WallNode,
        public scene: BABYLON.Scene,
        public canvas: HTMLCanvasElement
    ) {
        let n = node2.sprite.position.subtract(node1.sprite.position);
        let l = n.length();

        this.sprite = new Sprite("wall", "assets/wall.png", this.scene, l);
        this.sprite.height = 5;
        this.sprite.setPivotPoint(new BABYLON.Vector3(- l * 0.5, 0, 0));
        this.sprite.position.z = - 0.1;

        this.sprite.position.x = this.node1.sprite.position.x + l * 0.5;
        this.sprite.position.y = this.node1.sprite.position.y;

        this.sprite.rotation.z = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), new BABYLON.Vector2(n.x, n.y));
    }
}
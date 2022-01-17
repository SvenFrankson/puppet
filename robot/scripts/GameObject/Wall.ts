class WallNode extends GameObject {

    public isReady: boolean;

    public top: Sprite;

    public obstacle: Obstacle;

    constructor(
        main: Main
    ) {
        super(main);
        this.sprite = new Sprite("wall", "assets/wall_node_base.png", this.main.scene);
        this.sprite.height = 1;
        
        this.top = new Sprite("wall-top", "assets/wall_top.png", this.main.scene);
        this.top.position.y = Sprite.LEVEL_STEP;
        this.top.parent = this.sprite;
        this.top.height = 5;

        this.setDarkness(0.5);
    }

    public dispose(): void {
        super.dispose();
        this.sprite.dispose();
        this.top.dispose();
    }
    
    public makeReady(): void {
        this.isReady = true;
        this.setDarkness(1);
        if (!this.obstacle) {
            //this.obstacle = Obstacle.CreateHexagon(this.base.posX, this.base.posY, 2);
            this.obstacle = Obstacle.CreateRect(this.sprite.posX, this.sprite.posY, 2, 2, 0);
            this.obstacle.shape.rotation2D = Math.PI / 4;
            NavGraphManager.AddObstacle(this.obstacle);
        }
    }

    public setDarkness(d: number): void {
        this.sprite.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
        this.top.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
    }
}

class Wall extends GameObject {
    
    public isReady: boolean;

    public obstacle: Obstacle;
    
    constructor(
        public node1: WallNode,
        public node2: WallNode,
        main: Main
    ) {
        super(main);
        this.refreshMesh();
        this.setDarkness(0.5);
    }

    public dispose(): void {
        super.dispose();
        this.sprite.dispose();
    }
    
    public makeReady(): void {
        this.isReady = true;
        this.setDarkness(1);
        this.refreshObstacle();
    }

    public refreshMesh(): void {
        let n = this.node2.sprite.position.subtract(this.node1.sprite.position);
        let l = n.length();

        if (this.sprite) {
            this.sprite.refreshMesh(l);
        }
        else {
            if (l > 0) {
                this.sprite = new Sprite("wall", "assets/wall.png", this.main.scene, l);
                this.sprite.height = 5;
            }
            else {
                console.log("ouf");
            }
        }

        this.sprite.setPivotPoint(new BABYLON.Vector3(- l * 0.5, 0, 0));
        this.sprite.position.y = Sprite.QUAD_Y + 0.5 * Sprite.LEVEL_STEP;

        this.sprite.position.x = this.node1.sprite.position.x + l * 0.5;
        this.sprite.position.z = this.node1.sprite.position.z;
        
        this.sprite.rotation.y = - Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), new BABYLON.Vector2(n.x, n.z));
    }

    public refreshObstacle(): void {
        let c = this.node1.sprite.pos2D.add(this.node2.sprite.pos2D).scaleInPlace(0.5);
        let n = this.node2.sprite.pos2D.subtract(this.node1.sprite.pos2D);
        let l = n.length();
        let a = Math2D.AngleFromTo(new BABYLON.Vector2(1, 0), n);
        if (this.obstacle) {
            NavGraphManager.RemoveObstacle(this.obstacle);
        }
        this.obstacle = Obstacle.CreateRect(c.x, c.y, l, 0.5, a);
        NavGraphManager.AddObstacle(this.obstacle);
    }

    public setDarkness(d: number): void {
        this.sprite.spriteMaterial.diffuseColor.copyFromFloats(d, d, d);
    }
}
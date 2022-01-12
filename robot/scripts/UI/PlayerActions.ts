class PlayerAction {

    public _selectedTurret: Turret;

    public _selectedWallNode1: WallNode;
    public _selectedWallNode2: WallNode;
    public _selectedWall: Wall;

    constructor(
        public main: Main
    ) {

    }

    public addTurret(): void {
        if (this._selectedTurret) {
            return;
        }
        
        this._selectedTurret = new Turret(this.main);
        this._selectedTurret.ready = false;
        this._selectedTurret.setDarkness(0.5);
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingTurret);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingTurret)
    }

    public addWall(): void {
        if (this._selectedWallNode1 || this._selectedWallNode2) {
            return;
        }
        this._selectedWallNode1 = new WallNode(this.main);
        this._selectedWallNode1.isReady = false;
        this._selectedWallNode1.setDarkness(0.5);
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingWall);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingWall);
    }

    public _updateAddingTurret = () => {
        if (this._selectedTurret) {
            let pointerX = this.main.scene.pointerX / this.main.canvas.clientWidth;
            let pointerY = 1 - this.main.scene.pointerY / this.main.canvas.clientHeight;
            let worldX = this.main.camera.orthoLeft + pointerX * (this.main.camera.orthoRight - this.main.camera.orthoLeft);
            let worldY = this.main.camera.orthoBottom + pointerY * (this.main.camera.orthoTop - this.main.camera.orthoBottom);
            this._selectedTurret.base.position.x = worldX;
            this._selectedTurret.base.position.y = worldY;
            document.getElementById("debug-pointer-xy").innerText = (pointerX * 100).toFixed(1) + " : " + (pointerY * 100).toFixed(1);
        }
    }

    public _pointerUpAddingTurret = (eventData: BABYLON.PointerInfo) => {
        if (this._selectedTurret) {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                this._selectedTurret.ready = true;
                this._selectedTurret.setDarkness(1);
                this._selectedTurret = undefined;
                this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingTurret);
                this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingTurret)
            }
        }
    }

    public _updateAddingWall = () => {
        if (this._selectedWallNode1 && !this._selectedWallNode2) {
            let pointerX = this.main.scene.pointerX / this.main.canvas.clientWidth;
            let pointerY = 1 - this.main.scene.pointerY / this.main.canvas.clientHeight;
            let worldX = this.main.camera.orthoLeft + pointerX * (this.main.camera.orthoRight - this.main.camera.orthoLeft);
            let worldY = this.main.camera.orthoBottom + pointerY * (this.main.camera.orthoTop - this.main.camera.orthoBottom);
            this._selectedWallNode1.sprite.position.x = worldX;
            this._selectedWallNode1.sprite.position.y = worldY;
            document.getElementById("debug-pointer-xy").innerText = (pointerX * 100).toFixed(1) + " : " + (pointerY * 100).toFixed(1);
        }
        else if (this._selectedWallNode1 && this._selectedWallNode2 && this._selectedWall) {
            let pointerX = this.main.scene.pointerX / this.main.canvas.clientWidth;
            let pointerY = 1 - this.main.scene.pointerY / this.main.canvas.clientHeight;
            let worldX = this.main.camera.orthoLeft + pointerX * (this.main.camera.orthoRight - this.main.camera.orthoLeft);
            let worldY = this.main.camera.orthoBottom + pointerY * (this.main.camera.orthoTop - this.main.camera.orthoBottom);
            if (this._selectedWallNode2.sprite.position2D.x != worldX || this._selectedWallNode2.sprite.position2D.y != worldY) {
                this._selectedWallNode2.sprite.position.x = worldX;
                this._selectedWallNode2.sprite.position.y = worldY;
                this._selectedWall.refreshMesh();
            }
        }
    }

    public _pointerUpAddingWall = (eventData: BABYLON.PointerInfo) => {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
            if (this._selectedWallNode1 && !this._selectedWallNode2) {
                let pointerX = this.main.scene.pointerX / this.main.canvas.clientWidth;
                let pointerY = 1 - this.main.scene.pointerY / this.main.canvas.clientHeight;
                let worldX = this.main.camera.orthoLeft + pointerX * (this.main.camera.orthoRight - this.main.camera.orthoLeft);
                let worldY = this.main.camera.orthoBottom + pointerY * (this.main.camera.orthoTop - this.main.camera.orthoBottom);
                let world = new BABYLON.Vector2(worldX, worldY);
                let existingWallNode = this.main.gameObjects.find(
                    g => {
                        if (g instanceof WallNode) {
                            if (g.isReady) {
                                if (BABYLON.Vector2.DistanceSquared(world, g.sprite.position2D) < 1.5 * 1.5) {
                                    return true;
                                }
                            }
                        }
                    }
                ) as WallNode;

                if (existingWallNode) {
                    this._selectedWallNode1.dispose();

                    this._selectedWallNode1 = existingWallNode;
                }
                else {
                    this._selectedWallNode1.sprite.position.x = worldX;
                    this._selectedWallNode1.sprite.position.y = worldY;
                    this._selectedWallNode1.isReady = true;
                    this._selectedWallNode1.setDarkness(1);
                }
                
                this._selectedWallNode2 = new WallNode(this.main);
                this._selectedWallNode2.isReady = false;
                this._selectedWallNode2.setDarkness(0.5);

                this._selectedWall = new Wall(this._selectedWallNode1, this._selectedWallNode2, this.main);
                this._selectedWall.setDarkness(0.5);
            }
            else if (this._selectedWallNode1 && this._selectedWallNode2) {
                let pointerX = this.main.scene.pointerX / this.main.canvas.clientWidth;
                let pointerY = 1 - this.main.scene.pointerY / this.main.canvas.clientHeight;
                let worldX = this.main.camera.orthoLeft + pointerX * (this.main.camera.orthoRight - this.main.camera.orthoLeft);
                let worldY = this.main.camera.orthoBottom + pointerY * (this.main.camera.orthoTop - this.main.camera.orthoBottom);
                let world = new BABYLON.Vector2(worldX, worldY);
                let existingWallNode = this.main.gameObjects.find(
                    g => {
                        if (g instanceof WallNode) {
                            if (g.isReady && g != this._selectedWallNode1) {
                                if (BABYLON.Vector2.DistanceSquared(world, g.sprite.position2D) < 1.5 * 1.5) {
                                    return true;
                                }
                            }
                        }
                    }
                ) as WallNode;

                if (existingWallNode) {
                    this._selectedWallNode2.dispose();

                    this._selectedWallNode2 = existingWallNode;
                }
                else {
                    this._selectedWallNode2.sprite.position.x = worldX;
                    this._selectedWallNode2.sprite.position.y = worldY;
                    this._selectedWallNode2.isReady = true;
                    this._selectedWallNode2.setDarkness(1);
                }

                this._selectedWall.node2 = this._selectedWallNode2;
                this._selectedWall.refreshMesh();
                this._selectedWall.setDarkness(1);

                this._selectedWallNode1 = undefined;
                this._selectedWallNode2 = undefined;
                this._selectedWall = undefined;
                
                this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingWall);
                this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingWall);
            }
        }
    }
}
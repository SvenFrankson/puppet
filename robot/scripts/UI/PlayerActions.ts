class PlayerAction {

    public _selectedTurret: Turret;

    public _selectedWallNode1: WallNode;
    public _selectedWallNode2: WallNode;
    public _selectedWall: Wall;

    public _currentActionButton: HTMLInputElement;

    constructor(
        public main: Main
    ) {

    }

    public addTurret(actionButton: HTMLInputElement): void {
        if (this._selectedTurret) {
            return;
        }

        this._currentActionButton = actionButton;
        this._currentActionButton.classList.add("selected");
        
        this._selectedTurret = new Turret(this.main);
        this._selectedTurret.isReady = false;
        this._selectedTurret.setDarkness(0.5);
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingTurret);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingTurret)
    }

    public addWall(actionButton: HTMLInputElement): void {
        if (this._selectedWallNode1 || this._selectedWallNode2) {
            return;
        }

        this._currentActionButton = actionButton;
        this._currentActionButton.classList.add("selected");

        this._selectedWallNode1 = new WallNode(this.main);
        this._selectedWallNode1.isReady = false;
        this._selectedWallNode1.setDarkness(0.5);
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingWall);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingWall);
    }

    public _updateAddingTurret = () => {
        if (this._selectedTurret) {
            let world = this.main.getPointerWorldPos();
            this._selectedTurret.base.posX = world.x;
            this._selectedTurret.base.position.y = world.y;
        }
    }

    public _pointerUpAddingTurret = (eventData: BABYLON.PointerInfo) => {
        if (this._selectedTurret) {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                let newTurret = this._selectedTurret;
                this._selectedTurret = undefined;
                this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingTurret);
                this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingTurret);
                this._currentActionButton.classList.remove("selected");
                new LoadingPlane(
                    newTurret.base.pos2D,
                    10,
                    () => {
                        newTurret.makeReady();
                    },
                    this.main
                );
            }
        }
    }

    public _updateAddingWall = () => {
        if (this._selectedWallNode1 && !this._selectedWallNode2) {
            let world = this.main.getPointerWorldPos();
            this._selectedWallNode1.sprite.posX = world.x;
            this._selectedWallNode1.sprite.position.y = world.y;
        }
        else if (this._selectedWallNode1 && this._selectedWallNode2 && this._selectedWall) {
            let world = this.main.getPointerWorldPos();
            if (this._selectedWallNode2.sprite.pos2D.x != world.x || this._selectedWallNode2.sprite.pos2D.y != world.y) {
                this._selectedWallNode2.sprite.posX = world.x;
                this._selectedWallNode2.sprite.position.y = world.y;
                this._selectedWall.refreshMesh();
            }
        }
    }

    public _pointerUpAddingWall = (eventData: BABYLON.PointerInfo) => {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
            if (this._selectedWallNode1 && !this._selectedWallNode2) {
                let world = this.main.getPointerWorldPos();
                let existingWallNode = this.main.gameObjects.find(
                    g => {
                        if (g instanceof WallNode) {
                            if (g != this._selectedWallNode1) {
                                if (BABYLON.Vector2.DistanceSquared(world, g.sprite.pos2D) < 1.5 * 1.5) {
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
                    this._selectedWallNode1.sprite.posX = world.x;
                    this._selectedWallNode1.sprite.position.y = world.y;
                }
                
                this._selectedWallNode2 = new WallNode(this.main);
                this._selectedWallNode2.isReady = false;
                this._selectedWallNode2.setDarkness(0.5);

                this._selectedWall = new Wall(this._selectedWallNode1, this._selectedWallNode2, this.main);
                this._selectedWall.setDarkness(0.5);
            }
            else if (this._selectedWallNode1 && this._selectedWallNode2) {
                let world = this.main.getPointerWorldPos();
                let existingWallNode = this.main.gameObjects.find(
                    g => {
                        if (g instanceof WallNode) {
                            if (g != this._selectedWallNode1 && g != this._selectedWallNode2) {
                                if (BABYLON.Vector2.DistanceSquared(world, g.sprite.pos2D) < 1.5 * 1.5) {
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
                    this._selectedWallNode2.sprite.posX = world.x;
                    this._selectedWallNode2.sprite.position.y = world.y;
                }

                this._selectedWall.node2 = this._selectedWallNode2;

                let newWall = this._selectedWall;
                let newNode1 = this._selectedWallNode1;
                let newNode2 = this._selectedWallNode2;

                new LoadingPlane(
                    newNode1.sprite.pos2D.add(newNode2.sprite.pos2D).scale(0.5),
                    5,
                    () => {
                        newWall.makeReady();
                        newNode1.makeReady();
                        newNode2.makeReady();
                    },
                    this.main
                );

                this._selectedWallNode1 = undefined;
                this._selectedWallNode2 = undefined;
                this._selectedWall = undefined;
                
                this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingWall);
                this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingWall);
                this._currentActionButton.classList.remove("selected");
            }
        }
    }
}
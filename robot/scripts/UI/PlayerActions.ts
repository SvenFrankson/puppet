enum PlayerActionType {
    None,
    AddCanon,
    AddWall
}

class PlayerAction {

    public _selectedCanon: Canon;

    public _selectedWallNode1: WallNode;
    public _selectedWallNode2: WallNode;
    public _selectedWall: Wall;

    public currentActionType: PlayerActionType = PlayerActionType.None;
    public currentActionButton: HTMLInputElement;

    constructor(
        public main: Main
    ) {

    }

    public addCanon(actionButton: HTMLInputElement): void {
        if (this._selectedCanon) {
            return;
        }

        this.currentActionType = PlayerActionType.AddCanon;
        this.currentActionButton = actionButton;
        this.currentActionButton.classList.add("selected");
        
        this._selectedCanon = new Canon(this.main);
        this._selectedCanon.instantiate();
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingCanon);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingCanon)
    }

    public cancelAddCanon(): void {
        if (this._selectedCanon) {
            this._selectedCanon.dispose();
            this._selectedCanon = undefined;
        }
        this.currentActionType = PlayerActionType.None;
        this.currentActionButton.classList.remove("selected");
        this.currentActionButton = undefined;
        this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingCanon);
        this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingCanon)
    }

    public addWall(actionButton: HTMLInputElement): void {
        if (this._selectedWallNode1 || this._selectedWallNode2) {
            return;
        }

        this.currentActionButton = actionButton;
        this.currentActionButton.classList.add("selected");

        this._selectedWallNode1 = new WallNode(this.main);
        this._selectedWallNode1.isReady = false;
        this._selectedWallNode1.setDarkness(0.5);
        this.main.scene.onBeforeRenderObservable.add(this._updateAddingWall);
        this.main.scene.onPointerObservable.add(this._pointerUpAddingWall);
    }

    public _updateAddingCanon = () => {
        if (this._selectedCanon) {
            let world = this.main.getPointerWorldPos();
            this._selectedCanon.posX = world.x;
            this._selectedCanon.posY = world.y;
        }
    }

    public _pointerUpAddingCanon = (eventData: BABYLON.PointerInfo) => {
        if (this._selectedCanon) {
            if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (this.main.game.pay(100)) {
                    let newCanon = this._selectedCanon;
                    this._selectedCanon = undefined;
                    this.main.scene.onBeforeRenderObservable.removeCallback(this._updateAddingCanon);
                    this.main.scene.onPointerObservable.removeCallback(this._pointerUpAddingCanon);
                    this.currentActionType = PlayerActionType.None;
                    this.currentActionButton.classList.remove("selected");
                    this.currentActionButton = undefined;
                    new LoadingPlane(
                        newCanon.pos2D,
                        3,
                        () => {
                            newCanon.makeReady();
		                    newCanon.flattenGround(3);
                        },
                        this.main
                    );
                }
            }
        }
    }

    public _updateAddingWall = () => {
        if (this._selectedWallNode1 && !this._selectedWallNode2) {
            let world = this.main.getPointerWorldPos();
            this._selectedWallNode1.posX = world.x;
            this._selectedWallNode1.posY = world.y;
        }
        else if (this._selectedWallNode1 && this._selectedWallNode2 && this._selectedWall) {
            let world = this.main.getPointerWorldPos();
            if (this._selectedWallNode2.pos2D.x != world.x || this._selectedWallNode2.pos2D.y != world.y) {
                this._selectedWallNode2.posX = world.x;
                this._selectedWallNode2.posY = world.y;
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
                    this._selectedWallNode1.posX = world.x;
                    this._selectedWallNode1.posY = world.y;
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
                                if (BABYLON.Vector2.DistanceSquared(world, g.pos2D) < 1.5 * 1.5) {
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
                    this._selectedWallNode2.posX = world.x;
                    this._selectedWallNode2.posY = world.y;
                }

                this._selectedWall.node2 = this._selectedWallNode2;

                let l = BABYLON.Vector2.Distance(this._selectedWallNode1.pos2D, this._selectedWallNode2.pos2D);
                let cost = 25 + Math.ceil(l * 5);
                if (this.main.game.pay(cost)) {
                    let newWall = this._selectedWall;
                    let newNode1 = this._selectedWallNode1;
                    let newNode2 = this._selectedWallNode2;
    
                    new LoadingPlane(
                        newNode1.pos2D.add(newNode2.pos2D).scale(0.5),
                        3,
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
                    this.currentActionButton.classList.remove("selected");
                }
            }
        }
    }
}
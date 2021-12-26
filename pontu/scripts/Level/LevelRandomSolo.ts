class LevelRandomSolo extends Level {

    public deckSolo: Deck;
    public hand0: Tile;
    public hand1: Tile;

    constructor(
        main: Main
    ) {
        super(main);
    }

    public initialize(): void {
        super.initialize();

        this.deckSolo = new Deck();

        for (let c = 0; c < 4; c++) {
            for (let v = 1; v <= 9; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckSolo.cards.push(card);
                }
            }
        }
        this.deckSolo.shuffle();

        this.hand0 = new Tile(12, 0, this.main.board);
        this.hand1 = new Tile(13, 0, this.main.board);

        this.draw();

        this.main.board.updateShapes();
        this.main.scene.onPointerObservable.add(this.pointerEvent);
    }

    public draw(): void {
        if (this.hand0.value === 0) {
            let c = this.deckSolo.draw();
            if (c) {
                this.hand0.color = c.color;
                this.hand0.value = c.value;
                this.hand0.updateShape();
            }
        }
        if (this.hand1.value === 0) {
            let c = this.deckSolo.draw();
            if (c) {
                this.hand1.color = c.color;
                this.hand1.value = c.value;
                this.hand1.updateShape();
            }
        }
    }

    private pickedCard: number = -1;

    public pointerEvent = (eventData: BABYLON.PointerInfo) => {
        if (eventData.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            console.log("Alpha");
            if (eventData.pickInfo.pickedMesh) {
                console.log("Bravo " + eventData.pickInfo.pickedMesh.name);
                if (eventData.pickInfo.pickedMesh.name === "shape_12_0") {
                    console.log("Charly");
                    this.pickedCard = 0;
                }
                else if (eventData.pickInfo.pickedMesh.name === "shape_13_0") {
                    this.pickedCard = 1;
                }
            }
        }
        else if (eventData.type === BABYLON.PointerEventTypes.POINTERUP) {
            let ok = false;
            if (eventData.pickInfo.pickedMesh) {
                let split = eventData.pickInfo.pickedMesh.name.split("_");
                if (split.length === 3) {
                    let i = parseInt(split[1]);
                    let j = parseInt(split[2]);
                    if (isFinite(i) && isFinite(j)) {
                        ok = true;
                        let value = 0;
                        let color = -1;
                        if (this.pickedCard === 0) {
                            value = this.hand0.value;
                            color = this.hand0.color;
                        }
                        if (this.pickedCard === 1) {
                            value = this.hand1.value;
                            color = this.hand1.color;
                        }
                        if (this.main.board.play(color, value, i, j)) {
                            if (this.pickedCard === 0) {
                                this.hand0.reset();
                            }
                            if (this.pickedCard === 1) {
                                this.hand1.reset();
                            }
                            this.pickedCard = -1;
                            this.draw();
                        }
                    }
                }
            }
            if (!ok) {
                this.pickedCard = -1;
            }
        }
    }

    public update(): void {

    }

    public dispose(): void {
        super.dispose();
    }
}
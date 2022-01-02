/// <reference path="LevelPlayer.ts"/>

class LevelHumanVsAI extends LevelPlayer {

    public deckAI: Deck;

    constructor(
        main: Main
    ) {
        super(main);
    }

    public initialize(): void {
        super.initialize();
        this.main.board.playerCount = 2;

        this.deckAI = new Deck(this.main.board);
        this.makeAIDeck();
        this.deckAI.hand[0].i = - 10;
        this.deckAI.hand[0].j = 10;
        this.deckAI.hand[0].isPlayable = true;
        this.deckAI.hand[1].i = - 10;
        this.deckAI.hand[1].j = 10;
        this.deckAI.hand[1].isPlayable = true;
        this.deckAI.shuffle();
        this.deckAI.draw();
        this.deckAI.updateShape();
    }

    public makePlayerDeck(): void {
        for (let c = 0; c < 2; c++) {
            for (let v = 1; v <= Level.MAX_CARD_VALUE; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckPlayer.cards.push(card);
                }
            }
        }
    }

    public makeAIDeck(): void {
        for (let c = 2; c < 4; c++) {
            for (let v = 1; v <= Level.MAX_CARD_VALUE; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckAI.cards.push(card);
                }
            }
        }
    }

    /*
    public update(): void {
        if (this.main.board.activePlayer === 1) {
            let playableTiles: Tile[] = [];
            for (let i = 0; i < 11; i++) {
                for (let j = 0; j < 11; j++) {
                    let t = this.main.board.tiles[i][j];
                    if (t.isPlayable && t.isInRange && t.color < 2) {
                        playableTiles.push(t);
                    }
                }
            }
            ArrayUtils.shuffle(playableTiles);
            let bestN: number;
            let bestTile: Tile;
            let bestValue = - Infinity;
            for (let i = 0; i < playableTiles.length; i++) {
                for (let n = 0; n < 2; n++) {
                    let card = this.deckAI.hand[n];
                    if (card.value > playableTiles[i].value) {
                        let value = playableTiles[i].value - card.value;
                        if (value > bestValue) {
                            bestValue = value;
                            bestN = n;
                            bestTile = playableTiles[i];
                        }
                    }
                }
            }
            if (isFinite(bestValue)) {
                let card = this.deckAI.hand[bestN];
                if (this.main.board.play(1, card.color, card.value, bestTile.i, bestTile.j)) {
                    card.color = - 1;
                    card.value = 0;
                    this.deckAI.draw();
                    this.deckAI.updateShape();
                    return;
                }
            }
        }
    }
    */

    public lock: boolean = false;
    public update(): void {
        super.update();
        if (this.main.board.activePlayer === 1 && !this.lock) {
            let cloneTiles = this.main.board.cloneTiles();
            let playableTiles: Tile[] = [];
            for (let i = 0; i < 11; i++) {
                for (let j = 0; j < 11; j++) {
                    let t = cloneTiles[i][j];
                    if (t.isPlayable && t.isInRange && t.color < 2) {
                        playableTiles.push(t);
                    }
                }
            }
            ArrayUtils.shuffle(playableTiles);
            let bestN: number;
            let bestTile: Tile;
            let bestValue = - Infinity;
            for (let i = 0; i < playableTiles.length; i++) {
                for (let n = 0; n < 2; n++) {
                    let card = this.deckAI.hand[n];
                    if (card.value > playableTiles[i].value) {
                        let prevColor = playableTiles[i].color;
                        let prevValue = playableTiles[i].value;
                        playableTiles[i].color = card.color;
                        playableTiles[i].value = card.value;
                        let value = this.main.board.computeBoardValueForColor(card.color, cloneTiles);
                        value += this.main.board.computeBoardValueForColor(card.color === 2 ? 3 : 2, cloneTiles) * 0.1;
                        value -= this.main.board.computeBoardValueForColor(0, cloneTiles) * 1.5;
                        value -= this.main.board.computeBoardValueForColor(1, cloneTiles) * 1.5;

                        if (value > bestValue) {
                            bestValue = value;
                            bestN = n;
                            bestTile = playableTiles[i];
                        }

                        playableTiles[i].color = prevColor;
                        playableTiles[i].value = prevValue;
                    }
                }
            }
            if (isFinite(bestValue)) {
                console.log(bestValue);
                let card = this.deckAI.hand[bestN];
                this.lock = true;
                this.aiPlayAnimation(bestN, bestTile.i, bestTile.j, () => {
                    if (this.main.board.play(1, card.color, card.value, bestTile.i, bestTile.j)) {
                        this.lock = false;
                        card.color = - 1;
                        card.value = 0;
                        this.deckAI.draw();
                        this.deckAI.updateShape();
                        return;
                    }
                })
            }
            else {
                debugger;
            }
        }
    }

    public aiPlayAnimation(cardIndex: number, targetI: number, targetJ: number, callback: () => void): void {
        let p0 = this.deckAI.hand[cardIndex].shapePosition.clone();
        p0.y += 0.5;
        let p1 = this.main.board.tiles[targetI][targetJ].shapePosition.clone();
        p1.y += 0.5;
        let t = 0;
        let duration = 0.8;
        let step = () => {
            t += this.main.engine.getDeltaTime() / 1000;
            let dt = t / duration;
            if (dt >= 1) {
                this.deckAI.hand[cardIndex].resetShapePosition();
                callback();
            }
            else {
                this.deckAI.hand[cardIndex].shapePosition.copyFrom(p0).scaleInPlace(1 - dt).addInPlace(p1.scale(dt));
                requestAnimationFrame(step);
            }
        }
        step();
    }

    public dispose(): void {
        super.dispose();
        this.deckAI.hand.forEach(t => {
            console.log("Deck AI Dispose Tile");
            t.dispose();
        })
    }
}
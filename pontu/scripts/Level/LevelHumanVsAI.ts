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
        this.deckAI.hand[0].i = - 2;
        this.deckAI.hand[0].j = 0;
        this.deckAI.hand[1].i = - 3;
        this.deckAI.hand[1].j = 0;
        this.deckAI.shuffle();
        this.deckAI.draw();
        this.deckAI.updateShape();
    }

    public makePlayerDeck(): void {
        for (let c = 0; c < 2; c++) {
            for (let v = 1; v <= 9; v++) {
                for (let n = 0; n < 2; n++) {
                    let card = new Card(v, c);
                    this.deckPlayer.cards.push(card);
                }
            }
        }
    }

    public makeAIDeck(): void {
        for (let c = 2; c < 4; c++) {
            for (let v = 1; v <= 9; v++) {
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
            let ok = false;
            for (let i = 0; i < 1000; i++) {
                let n = Math.floor(Math.random() * 2);
                let pickedCard = this.deckAI.hand[n];
                if (pickedCard.value > 0) {
                    let I = Math.floor(Math.random() * 11);
                    let J = Math.floor(Math.random() * 11);
                    let currentBoardTile = this.main.board.tiles[I][J];
                    if (currentBoardTile.isInRange && currentBoardTile.isPlayable) {
                        if (currentBoardTile.color < 2) {
                            ok = this.main.board.play(1, pickedCard.color, pickedCard.value, I, J);
                            if (ok) {
                                pickedCard.color = - 1;
                                pickedCard.value = 0;
                                this.deckAI.draw();
                                this.deckAI.updateShape();
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    */

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
            playableTiles.sort((a, b) => { return Math.random() - 0.5; }),
            console.log(playableTiles.length);
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

    public dispose(): void {
        super.dispose();
    }
}
class LevelHumanVsAIEasy extends LevelHumanVsAI {

    public lock: boolean = false;

    public update(): void {
        super.update();
        if (this.main.board.activePlayer === 1 && !this.lock) {
            for (let i = 0; i < 1000; i++) {
                let n = Math.floor(Math.random() * 2);
                let card = this.deckAI.hand[n];
                if (card.value > 0) {
                    let I = Math.floor(Math.random() * 11);
                    let J = Math.floor(Math.random() * 11);
                    let currentBoardTile = this.main.board.tiles[I][J];
                    if (currentBoardTile.isInRange && currentBoardTile.isPlayable) {
                        if (currentBoardTile.color < 2 && currentBoardTile.value < card.value) {
                            this.lock = true;
                            return this.aiPlayAnimation(n, I, J, () => {
                                if (this.main.board.play(1, card.color, card.value, I, J)) {
                                    this.lock = false;
                                    card.color = - 1;
                                    card.value = 0;
                                    this.deckAI.draw();
                                    this.deckAI.updateShape();
                                }
                            })
                        }
                    }
                }
            }
        }
    }
}
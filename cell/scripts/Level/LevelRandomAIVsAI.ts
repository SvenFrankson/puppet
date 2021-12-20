class LevelRandomAIVsAI extends Level {

    public scoreDisplay: Score;

    public initialize(): void {
        super.initialize();

        this.scoreDisplay = new Score(3, this.main.cellNetwork);

		this.main.cellNetwork.generate(25, 300);
		this.main.cellNetwork.checkSurround(
			() => {
				this.scoreDisplay.update();
			}
		);

		let aiPlayer0 = new AI(0, this.main.cellNetwork);
		let aiPlayer1 = new AI(1, this.main.cellNetwork);

		let step = async () => {
            this.scoreDisplay.update();
            await AsyncUtils.timeOut(50);
            let aiTestMove = aiPlayer0.getMove2(0, 1);
            if (aiTestMove.cell) {
                this.main.cellNetwork.morphCell(
                    0,
                    aiTestMove.cell,
                    aiTestMove.reverse,
                    () => {
                        this.main.cellNetwork.checkSurround(
                            async () => {
                                this.scoreDisplay.update();
                                await AsyncUtils.timeOut(50);
                                let aiMove = aiPlayer1.getMove2(2, 1);
                                if (aiMove.cell) {
                                    this.main.cellNetwork.morphCell(
                                        2,
                                        aiMove.cell,
                                        aiMove.reverse,
                                        () => {
                                            this.main.cellNetwork.checkSurround(step);
                                        }
                                    );
                                }
                                else {
                                    await AsyncUtils.timeOut(1000);
                                    this.dispose();
                                }
                            }
                        );
                    }
                );
            }
            else {
                await AsyncUtils.timeOut(1000);
                this.dispose();
            }
		}
		setTimeout(step, 1000);
    }

    public update(): void {

    }

    public dispose(): void {
        super.dispose();
        if (this.scoreDisplay) {
            this.scoreDisplay.dispose();
        }
    }
}
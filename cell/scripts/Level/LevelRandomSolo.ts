class LevelRandomSolo extends Level {

    public scoreDisplay: Score;

    constructor(
        main: Main,
        public size: number = 300
    ) {
        super(main);
    }

    public initialize(): void {
        super.initialize();

        this.scoreDisplay = new Score(3, this.main.cellNetwork);

		this.main.cellNetwork.generate(25, this.size);
		this.main.cellNetwork.checkSurround(
			() => {
				this.scoreDisplay.update();
			}
		);
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
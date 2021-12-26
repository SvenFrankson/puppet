class Board {

    public playerCount: number = 1;
    public activePlayer: number = 0;
    public tiles: Tile[][];

    constructor(
        public main: Main
    ) {
        this.tiles = [];
        for (let i = 0; i < 11; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j] = new Tile(i, j, this);
            }
        }
        this.tiles[5][5].isPlayable = true;
    }

    public generateRandom(): void {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (Math.random() > 0.5) {
                    this.tiles[i][j].color = Math.floor(4 * Math.random());
                    this.tiles[i][j].value = 1 + Math.floor(9 * Math.random());
                }
            }
        }
        this.tiles[0][0].color = 0;
        this.tiles[0][0].value = 9;
        this.tiles[10][0].color = 1;
        this.tiles[10][0].value = 9;
        this.updateShapes();
    }

    public updateRangeAndPlayable(): void {
        let iMin = 5;
        let jMin = 5;
        let iMax = 5;
        let jMax = 5;

        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (this.tiles[i][j].value > 0) {
                    iMin = Math.min(i, iMin);
                    jMin = Math.min(j, jMin);
                    iMax = Math.max(i, iMax);
                    jMax = Math.max(j, jMax);
                    for (let ii = -1; ii <= 1; ii++) {
                        for (let jj = -1; jj <= 1; jj++) {
                            if (i + ii >= 0 && i + ii < 11 && j + jj >= 0 && j + jj < 11) {
                                this.tiles[i + ii][ j + jj].isPlayable = true;
                            }
                        }
                    }
                }
            }
        }

        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (i >= iMin + 6) {
                    this.tiles[i][j].isInRange = false;
                }
                if (j >= jMin + 6) {
                    this.tiles[i][j].isInRange = false;
                }
                if (i <= iMax - 6) {
                    this.tiles[i][j].isInRange = false;
                }
                if (j <= jMax - 6) {
                    this.tiles[i][j].isInRange = false;
                }
            }
        }
    }

    public updateShapes(): void {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j].updateShape();
            }
        }
    }

    public reset(): void {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j].reset();
            }
        }
    }

    public play(player: number, color: number, value: number, i: number, j: number): boolean {
        if (player != this.activePlayer) {
            return false;
        }
        if (i >= 0 && i < 11 && j >= 0 && j < 11) {
            let tile = this.tiles[i][j];
            if (tile.isInRange && tile.value < value) {
                tile.color = color;
                tile.value = value;
                this.updateRangeAndPlayable();
                this.updateShapes();
                this.activePlayer = (this.activePlayer + 1) % this.playerCount;
                return true;
            }
        }
        return false;
    }
}
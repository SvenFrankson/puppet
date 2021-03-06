class Board {

    public playerCount: number = 1;
    public activePlayer: number = 0;
    public tiles: Tile[][];

    public ICenter: number = 5;
    public JCenter: number = 5;

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
        for (let i = 4; i <= 6; i++) {
            for (let j = 4; j <= 6; j++) {
                this.tiles[i][j].isNextToPlayable = true;
            }
        }
    }

    public cloneTiles(): Tile[][] {
        let clonedTiles: Tile[][] = [];
        for (let i = 0; i < 11; i++) {
            clonedTiles[i] = [];
            for (let j = 0; j < 11; j++) {
                clonedTiles[i][j] = this.tiles[i][j].clone();
            }
        }
        return clonedTiles;
    }

    public updateRangeAndPlayable(tiles?: Tile[][]): void {
        if (!tiles) {
            tiles = this.tiles;
        }
        let iMin = 5;
        let jMin = 5;
        let iMax = 5;
        let jMax = 5;

        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (tiles[i][j].value > 0) {
                    iMin = Math.min(i, iMin);
                    jMin = Math.min(j, jMin);
                    iMax = Math.max(i, iMax);
                    jMax = Math.max(j, jMax);
                    for (let ii = -2; ii <= 2; ii++) {
                        for (let jj = -2; jj <= 2; jj++) {
                            if (i + ii >= 0 && i + ii < 11 && j + jj >= 0 && j + jj < 11) {
                                tiles[i + ii][ j + jj].isNextToPlayable = true;
                            }
                        }
                    }
                    for (let ii = -1; ii <= 1; ii++) {
                        for (let jj = -1; jj <= 1; jj++) {
                            if (i + ii >= 0 && i + ii < 11 && j + jj >= 0 && j + jj < 11) {
                                tiles[i + ii][ j + jj].isPlayable = true;
                            }
                        }
                    }
                }
            }
        }

        this.ICenter = (iMin + iMax) * 0.5;
        this.JCenter = (jMin + jMax) * 0.5;

        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (i >= iMin + 6) {
                    tiles[i][j].isInRange = false;
                }
                if (j >= jMin + 6) {
                    tiles[i][j].isInRange = false;
                }
                if (i <= iMax - 6) {
                    tiles[i][j].isInRange = false;
                }
                if (j <= jMax - 6) {
                    tiles[i][j].isInRange = false;
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

    public updateShapesTextPosition(): void {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j].updateTextPosition();
            }
        }
    }

    public reset(): void {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j].reset();
            }
        }
        this.tiles[5][5].isPlayable = true;
        for (let i = 4; i <= 6; i++) {
            for (let j = 4; j <= 6; j++) {
                this.tiles[i][j].isNextToPlayable = true;
            }
        }

        this.activePlayer = 0;
        this.ICenter = 5;
        this.JCenter = 5;
        this.updateShapes();
    }

    public hide(): void {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                this.tiles[i][j].hide();
            }
        }
    }

    public play(player: number, color: number, value: number, i: number, j: number): boolean {
        if (player != this.activePlayer) {
            return false;
        }
        if (i >= 0 && i < 11 && j >= 0 && j < 11) {
            let tile = this.tiles[i][j];
            if (tile.isPlayable && tile.isInRange && tile.value < value) {
                tile.color = color;
                tile.value = value;
                this.updateRangeAndPlayable();
                this.updateShapes();
                let victor = this.checkVictor();
                if (victor != - 1) {
                    this.main.showEndGame(victor);
                    return false;
                }
                this.activePlayer = (this.activePlayer + 1) % this.playerCount;
                return true;
            }
        }
        return false;
    }

    public computeBoardValueForColor(c: number, tiles?: Tile[][]): number {
        if (!tiles) {
            tiles = this.tiles;
        }
        let value = 0;
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                let t = tiles[i][j];
                if (c === t.color) {
                    for (let di = - 1; di <= 1; di++) {
                        for (let dj = - 1; dj <= 1; dj++) {
                            if (di != 0 || dj != 0) {
                                let l = 1;
                                let minValueToPLay = 1;
                                for (let n = 1; n < 5; n++) {
                                    let ii = i + n * di;
                                    let jj = j + n * dj;
                                    if (ii >= 0 && ii < 11 && jj >= 0 && jj < 11 && tiles[ii][jj].isInRange) {
                                        if (tiles[ii][jj].color === c) {
                                            l++;
                                        }
                                        else {
                                            minValueToPLay = Math.max(minValueToPLay, tiles[ii][jj].value + 1);
                                        }
                                    }
                                    else {
                                        l = 0;
                                        break;
                                    }
                                }
                                if (l === 5) {
                                    return 100000;
                                }
                                if (minValueToPLay < 10) {
                                    let v = 10 - minValueToPLay + Math.pow(10, l);
                                    value = Math.max(v, value);
                                }
                            }
                        }
                    }
                }
            }
        }
        return value;
    }

    public checkVictor(): number {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                let t = this.tiles[i][j];
                let c = t.color;
                if (c >= 0) {
                    for (let di = - 1; di <= 1; di++) {
                        for (let dj = - 1; dj <= 1; dj++) {
                            if (di != 0 || dj != 0) {
                                let victory = true;
                                for (let n = 1; n < 5; n++) {
                                    let ii = i + n * di;
                                    let jj = j + n * dj;
                                    if (ii >= 0 && ii < 11 && jj >= 0 && jj < 11) {
                                        if (this.tiles[ii][jj].color != c) {
                                            victory = false;
                                        }
                                    }
                                    else {
                                        victory = false;
                                    }
                                }
                                if (victory === true) {
                                    this.activePlayer = - 1;
                                    return Math.floor(c / 2);
                                }
                            }
                        }
                    }
                }
            }
        }
        return -1;
    }

    public checkSubVictor(): number {
        let bestC: number = - 1;
        let bestValue: number = Infinity;
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                let t = this.tiles[i][j];
                let c = t.color;
                if (c >= 0) {
                    for (let di = - 1; di <= 1; di++) {
                        for (let dj = - 1; dj <= 1; dj++) {
                            if (di != 0 || dj != 0) {
                                let subVictory = true;
                                let value = 0;
                                for (let n = 1; n < 4; n++) {
                                    let ii = i + n * di;
                                    let jj = j + n * dj;
                                    if (ii >= 0 && ii < 11 && jj >= 0 && jj < 11) {
                                        if (this.tiles[ii][jj].color != c) {
                                            subVictory = false;
                                        }
                                        else {
                                            value += this.tiles[ii][jj].value;
                                        }
                                    }
                                    else {
                                        subVictory = false;
                                    }
                                }
                                if (subVictory === true) {
                                    if (value < bestValue) {
                                        bestValue = value;
                                        bestC = c;
                                    }
                                    else if (value === bestValue) {
                                        if (Math.floor(bestC * 0.5) != Math.floor(c * 0.5)) {
                                            bestC = - 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return bestC;
    }
}
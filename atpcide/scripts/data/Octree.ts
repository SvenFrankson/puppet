var pow2Values = [1, 2, 4, 8, 16];

function pow2(n: number): number {
    return pow2Values[n];
}

var icoefs = [0, 1, 0, 1, 0, 1, 0, 1];
var jcoefs = [0, 0, 1, 1, 0, 0, 1, 1];
var kcoefs = [0, 0, 0, 0, 1, 1, 1, 1];

class OctreeNode {

    public i: number;
    public j: number;
    public k: number;
    public value: number;

    public children: OctreeNode[] = [];

    private _size: number;
    public get size(): number {
        return this._size;
    }
    private _childSize: number = 1;
    public get childSize(): number {
        return this._childSize;
    }

    constructor(
        public level: number,
        public parent: OctreeNode
    ) {
        this._size = pow2(this.level);
        if (this.level > 1) {
            this._childSize = this._size * 0.5;
        }
    }

    public getValue(i: number, j: number, k: number): number {
        if (isFinite(this.value)) {
            return this.value;
        }
        let ci = 1;
        if (i < this.i) {
            ci = 0;
        }
        let cj = 1;
        if (j < this.j) {
            cj = 0;
        }
        let ck = 1;
        if (k < this.k) {
            ck = 0;
        }
        return this.children[ci + cj * 2 + ck * 4].getValue(i, j, k);
    }

    public subdivide(): void {
        for (let n = 0; n < 8; n++) {
            let child = new OctreeNode(this.level - 1, this);
            child.i = this.i + icoefs[n] * this.childSize;
            child.j = this.j + jcoefs[n] * this.childSize;
            child.k = this.k + kcoefs[n] * this.childSize;
            child.value = this.value;
            this.children[n] = child;
        }
        delete this.value;
    }

    public collapse(): void {
        this.value = this.children[0].value;
        this.children = [];
    }
}

class Octree extends OctreeNode {

    constructor(
        public maxLevel: number = 4
    ) {
        super(maxLevel, undefined);
        this.value = 0;
        this.i = 0;
        this.j = 0;
        this.k = 0;
    }
}
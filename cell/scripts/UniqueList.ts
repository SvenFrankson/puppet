class UniqueList<T> {

    private _elements: T[] = [];

    public get length(): number {
        return this._elements.length;
    }

    public get(i: number): T {
        return this._elements[i];
    }

    public getLast(): T {
        return this.get(this.length - 1);
    }

    public push(e: T) {
        if (this._elements.indexOf(e) === -1) {
            this._elements.push(e);
        }
    }

    public pop(): T {
        return this._elements.pop();
    }

    public remove(e: T) {
        let i = this._elements.indexOf(e);
        if (i != -1) {
            this._elements.splice(i, 1);
        }
    }

    public contains(e: T): boolean {
        return this._elements.indexOf(e) != - 1;
    }

    public sort(sortFunction: (a: T, b: T) => number): void {
        this._elements = this._elements.sort(sortFunction);
    }

    public forEach(callbackfn: (a: T) => void): void {
        this._elements.forEach(callbackfn);
    }
}
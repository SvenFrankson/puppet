class BabylonPlus {

    public static CreateInstanceDeep(target: BABYLON.Mesh): BABYLON.AbstractMesh {
        let instance: BABYLON.AbstractMesh;
        if (target.geometry) {
            instance = target.createInstance(target.name + "-instance");
        }
        else {
            instance = new BABYLON.Mesh(target.name + "-instance");
        }

        let children = target.getChildMeshes();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            if (child instanceof BABYLON.Mesh) {
                let childInstance = child.createInstance(child.name + "-instance");
                childInstance.parent = instance;
            }
        }

        return instance;
    }
}

class UniqueList<T> {

    private _elements: T[] = [];

    public length(): number {
        return this._elements.length;
    }

    public get(i: number): T {
        return this._elements[i];
    }

    public getLast(): T {
        return this.get(this.length() - 1);
    }

    public push(e: T) {
        if (this._elements.indexOf(e) === -1) {
            this._elements.push(e);
        }
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
}
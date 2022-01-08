class ArrayUtils {

    public static shuffle(array: any[]): void {
        let l = array.length;
        for (let i = 0; i < l * l; i++) {
            let i0 = Math.floor(Math.random() * l);
            let i1 = Math.floor(Math.random() * l);
            let e0 = array[i0];
            let e1 = array[i1];
            array[i0] = e1;
            array[i1] = e0;
        }
    }
}
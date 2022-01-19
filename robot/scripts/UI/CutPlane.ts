class CutPlane {

    public static CreateVerticalVertexData(w: number, h: number, from: number = 0, to: number = 1): BABYLON.VertexData {
        let data = new BABYLON.VertexData();
        
        let positions: number[] = [];
        let indices: number[] = [];
        let uvs: number[] = [];

        let ww = 0.5 * w;
        let hh = 0.5 * h;

        positions.push(
            - ww, 0, - hh + h * from,
            - ww, 0, - hh + h * to,
            ww, 0, - hh + h * to,
            ww, 0, - hh + h * from
        );

        indices.push(
            0, 2, 1,
            0, 3, 2
        );

        uvs.push(
            0, from,
            0, to,
            1, to,
            1, from
        );

        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;

        return data;
    }
}
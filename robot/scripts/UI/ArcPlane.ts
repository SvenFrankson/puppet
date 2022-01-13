class ArcPlane {

    public static CreateVertexData(r: number, from: number, to: number): BABYLON.VertexData {
        while (to < from) {
            to += 2 * Math.PI;
        }

        let a = from;
        let cosa = Math.cos(a);
        let sina = Math.sin(a);

        let data = new BABYLON.VertexData();
        let px = cosa;
        let py = sina;
        if (px > Math.SQRT2 * 0.5) {
            py /= px;
            px = 1;
        }
        else if (py > Math.SQRT2 * 0.5) {
            px /= py;
            py = 1;
        }

        let positions: number[] = [0, 0, 0, r * px, r * py, 0];
        let indices: number[] = [];
        let uvs: number[] = [0.5, 0.5, px * 0.5 + 0.5, py * 0.5 + 0.5];

        let l = 2;

        while (a < to) {
            a = Math.min(to, a + Math.PI / 32);
            cosa = Math.cos(a);
            sina = Math.sin(a);
            
            let px = cosa;
            let py = sina;
            if (px > Math.SQRT2 * 0.5) {
                py /= px;
                px = 1;
            }
            else if (py > Math.SQRT2 * 0.5) {
                px /= py;
                py = 1;
            }
            else if (px < - Math.SQRT2 * 0.5) {
                py /= - px;
                px = - 1;
            }
            else if (py < - Math.SQRT2 * 0.5) {
                px /= - py;
                py = - 1;
            }

            positions.push(r * px, r * py, 0);
            uvs.push(px * 0.5 + 0.5, py * 0.5 + 0.5);
            indices.push(l, 0, l - 1);

            l++;
        }

        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;

        return data;
    }
}
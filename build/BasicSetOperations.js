import { VoxelStorage } from "./VoxelStorage.js";
export class BasicSetOperations {
    static INTERSECTION(objs, returnList) {
        const points = [];
        const voxelStorage = new VoxelStorage(objs[0].getMaxDimensions(), objs[0].getFactoryMethod());
        let smallestObject = objs[0];
        let smallestObjectIndex = 0;
        for (let i = 0; i < objs.length; i++) {
            let o = objs[i];
            if (o.getCoordinateCount() < smallestObject.getCoordinateCount()) {
                smallestObject = o;
                smallestObjectIndex = i;
            }
        }
        let coordinates = smallestObject.getCoordinateList(false);
        coordinateLoop: for (let coord of coordinates) {
            for (let i = 0; i < objs.length; i++) {
                if (i != smallestObjectIndex && !objs[i].hasVoxel(coord)) {
                    continue coordinateLoop;
                }
            }
            if (returnList) {
                points.push(coord);
            }
            else {
                voxelStorage.addCoordinate(coord, false);
            }
        }
        if (returnList) {
            return points;
        }
        return voxelStorage;
    }
    static UNION(objs, returnList) {
        const points = [];
        const voxelStorage = new VoxelStorage(objs[0].getMaxDimensions(), objs[0].getFactoryMethod());
        let smallestObject = objs[0];
        let smallestObjectIndex = 0;
        for (let i = 0; i < objs.length; i++) {
            let o = objs[i];
            if (o.getCoordinateCount() < smallestObject.getCoordinateCount()) {
                smallestObject = o;
                smallestObjectIndex = i;
            }
        }
        for (let o of objs) {
            let coordinates = o.getCoordinateList(false);
            for (let coord of coordinates) {
                voxelStorage.addCoordinate(coord, false);
            }
        }
        return returnList ? voxelStorage.getCoordinateList(false) : voxelStorage;
    }
    /**
     * Computes A - B
     *
     * @param a Set A
     * @param b Set B
     * @param returnList
     * @returns
     */
    static SUBTRACTION(a, b, returnList) {
        if (a.getMaxDimensions() != b.getMaxDimensions()) {
            throw new Error("Can not subtract varying dimensions");
        }
        const points = [];
        const voxelStorage = new VoxelStorage(a.getMaxDimensions(), a.getFactoryMethod());
        const coordinates = b.getCoordinateList(false);
        for (let coord of coordinates) {
            if (!a.hasVoxel(coord)) {
                if (returnList) {
                    points.push(coord);
                }
                else {
                    voxelStorage.addCoordinate(coord, false);
                }
            }
        }
        if (returnList) {
            return points;
        }
        else {
            return voxelStorage;
        }
    }
    static COMPLIMENT(a, universalSet, returnList) {
        const points = [];
        const voxelStorage = new VoxelStorage(a.getMaxDimensions(), a.getFactoryMethod());
        for (let o of universalSet) {
            if (o != a) {
                let currentCoordinates = o.getCoordinateList(false);
                for (let coord of currentCoordinates) {
                    if (!a.hasVoxel(coord)) {
                        if (returnList) {
                            points.push(coord);
                        }
                        else {
                            voxelStorage.addCoordinate(coord, false);
                        }
                    }
                }
            }
        }
        if (returnList) {
            return points;
        }
        return voxelStorage;
    }
}

import { VoxelStorage } from "./VoxelStorage.js";
export class BaseObject {
    voxelStorage;
    constructor(dimensionCount) {
        this.voxelStorage = new VoxelStorage(dimensionCount);
    }
    preHash() {
        return this;
    }
    toPrint() {
        return JSON.stringify(this.voxelStorage.getCoordinateList());
    }
    static brensenham(p1, p2) {
        if (p1.dimensionCount() != p2.dimensionCount() || p1.dimensionCount() === 0 || p2.dimensionCount() === 0) {
            throw new Error(`Dimensions are not the same or dimension count are zero: p1 ${p1.dimensionCount()} verse p2 ${p2.dimensionCount()}`);
        }
        const startPoint = p1.arr;
        const endPoint = p2.arr;
        const currentPoint = [...startPoint];
        const differences = [];
        let indexOfGreatest = 0;
        const dimensions = p1.dimensionCount();
        for (let i = 0; i < dimensions; i++) {
            differences.push(Math.abs(endPoint[i] - startPoint[i]));
            if (differences[i] > differences[indexOfGreatest]) {
                indexOfGreatest = i;
            }
        }
        let steppingValues = [];
        let coordinates = [];
        for (let i = 0; i < dimensions; i++) {
            steppingValues.push(2 * differences[i] - differences[indexOfGreatest]);
        }
        while (currentPoint[indexOfGreatest] <= endPoint[indexOfGreatest]) {
            coordinates.push(p1.factoryMethod([...currentPoint]));
            for (let i = 0; i < dimensions; i++) {
                if (i === indexOfGreatest) {
                    continue;
                }
                else if (steppingValues[i] < 0) {
                    steppingValues[i] += (2 * differences[i]);
                }
                else {
                    currentPoint[i] += 1;
                    steppingValues[i] += ((2 * differences[i]) - (2 * differences[indexOfGreatest]));
                }
            }
            currentPoint[indexOfGreatest] += 1;
        }
        return coordinates;
    }
}

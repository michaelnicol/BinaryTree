import { HashStorage } from "./HashStorage.js";
import { VoxelStorage } from "./VoxelStorage.js";
import { Point2D } from "./Point2D.js";
import { PointFactoryMethods } from "./PointFactoryMethods.js";
import { BoundingBox2D } from "./BoundingBox2D.js";
export class Utilities {
    static pythagorean(p1, p2) {
        if (p1.dimensionCount() != p2.dimensionCount() || p1.dimensionCount() === 0 || p2.dimensionCount() === 0) {
            throw new Error(`Dimensions are not the same or dimension count is zero: p1 ${p1.dimensionCount()} verse p2 ${p2.dimensionCount()}`);
        }
        let d = 0;
        for (let i = 0; i < p1.dimensionCount(); i++) {
            d += Math.pow(Math.abs(p1.arr[i] - p2.arr[i]), 2);
        }
        return Math.sqrt(d);
    }
    static bresenham(p1, p2, returnType) {
        if (p1.dimensionCount() != p2.dimensionCount() || p1.dimensionCount() === 0 || p2.dimensionCount() === 0) {
            throw new Error(`Dimensions are not the same or dimension count is zero: p1 ${p1.dimensionCount()} verse p2 ${p2.dimensionCount()}`);
        }
        let coordinates = [];
        let voxelStorage = new VoxelStorage(p1.dimensionCount());
        let hashStorage = new HashStorage(p1.dimensionCount());
        let flag = true;
        for (let i = 0; i < p1.dimensionCount(); i++) {
            if (p1.arr[i] != p2.arr[i]) {
                flag = false;
            }
        }
        if (flag) {
            if (returnType === 0) {
                return [p1];
            }
            else if (returnType === 1) {
                voxelStorage.addCoordinate(p1, false);
                return voxelStorage;
            }
            else {
                hashStorage.addCoordinate(p1, false);
                return hashStorage;
            }
        }
        const startPoint = p1.arr;
        const endPoint = p2.arr;
        const currentPoint = [...startPoint];
        const differences = [];
        const increments = [];
        let indexOfGreatest = 0;
        const dimensions = p1.dimensionCount();
        for (let i = 0; i < dimensions; i++) {
            differences.push(Math.abs(endPoint[i] - startPoint[i]));
            if (endPoint[i] - startPoint[i] < 0) {
                increments.push(-1);
            }
            else {
                increments.push(1);
            }
            if (differences[i] > differences[indexOfGreatest]) {
                indexOfGreatest = i;
            }
        }
        let steppingValues = [];
        for (let i = 0; i < dimensions; i++) {
            steppingValues.push(2 * differences[i] - differences[indexOfGreatest]);
        }
        while (true) {
            if (!(startPoint[indexOfGreatest] < endPoint[indexOfGreatest] ? (currentPoint[indexOfGreatest] <= endPoint[indexOfGreatest]) : (currentPoint[indexOfGreatest] >= endPoint[indexOfGreatest]))) {
                if (returnType === 0) {
                    return coordinates;
                }
                else if (returnType === 1) {
                    return voxelStorage;
                }
                else {
                    return hashStorage;
                }
            }
            if (returnType === 0) {
                coordinates.push(p1.factoryMethod([...currentPoint]));
            }
            else if (returnType === 1) {
                voxelStorage.addCoordinate(p1.factoryMethod([...currentPoint]), false);
            }
            else {
                hashStorage.addCoordinate(p1.factoryMethod([...currentPoint]), false);
            }
            for (let i = 0; i < dimensions; i++) {
                if (i === indexOfGreatest) {
                    continue;
                }
                else if (steppingValues[i] < 0) {
                    steppingValues[i] += (2 * differences[i]);
                }
                else {
                    currentPoint[i] += increments[i];
                    steppingValues[i] += ((2 * differences[i]) - (2 * differences[indexOfGreatest]));
                }
            }
            currentPoint[indexOfGreatest] += increments[indexOfGreatest];
        }
    }
    static pointCenter(points) {
        let center = new Point2D(0, 0);
        points.forEach(value => {
            center.arr[0] += value.arr[0];
            center.arr[1] += value.arr[1];
        });
        center.arr[0] /= points.length;
        center.arr[1] /= points.length;
        return center;
    }
    static rotatePoint(point, center, rad) {
        const cx = center.arr[0];
        const cy = center.arr[1];
        const px = point.arr[0] - cx;
        const py = point.arr[1] - cy;
        return new Point2D(((px * Math.cos(rad)) - (py * Math.sin(rad))) + cx, ((px * Math.sin(rad)) + (py * Math.cos(rad))) + cy);
    }
    static pythagoreanSort(points, referencePoint) {
        return points.sort((a, b) => Utilities.pythagorean(referencePoint, a) - Utilities.pythagorean(referencePoint, b));
    }
    static #radToDegConstant = 180 / Math.PI;
    /**
     * Polar sorts a given list of points. If any amount of points share the same polar angle, the furthest polar point is kept.
     *
     * @param points
     */
    static polarSort(points, removeCollinear, referencePoint) {
        let sortedPoints = points.reduce((accumulator, cv) => {
            return accumulator.push(cv.clone()), accumulator;
        }, []).sort((a, b) => a.arr[1] - b.arr[1]).sort((a, b) => a.arr[0] - b.arr[0]);
        const assertedRF = referencePoint == undefined ? sortedPoints[0] : referencePoint;
        const polarMap = new Map();
        sortedPoints.forEach((value) => {
            let angle = Math.atan2((value.arr[1] - assertedRF.arr[1]), (value.arr[0] - assertedRF.arr[0])) * Utilities.#radToDegConstant;
            angle += angle < 0 ? 360 : 0;
            polarMap.has(angle) ? polarMap.get(angle)?.push(value) : polarMap.set(angle, [value]);
        });
        if (removeCollinear) {
            polarMap.forEach((value, key) => {
                value = [Utilities.pythagoreanSort(value, assertedRF)[0]];
            });
        }
        let sortedKeys = Object.keys(polarMap).map(value => Number(value)).sort((a, b) => a - b);
        let returnPoints = [];
        sortedKeys.forEach(value => returnPoints.push(polarMap.get(value)[0]));
        return returnPoints;
    }
    static pointOrientation = (p1, p2, p3) => {
        // returns slope from p1 to p2 minus p2 to p3
        return ((p2.arr[1] - p1.arr[1]) * (p3.arr[0] - p2.arr[0])) - ((p2.arr[0] - p1.arr[0]) * (p3.arr[1] - p1.arr[1]));
    };
    static cross2D = (p1, p2) => {
        return (p1.arr[0] * p2.arr[1]) - (p2.arr[0] * p1.arr[1]);
    };
    static convexHull(inputPoints) {
        let stack = [];
        // Sort the data set from lowest x value to highest
        let sortedPoints = inputPoints.reduce((accumulator, value) => {
            return accumulator.push(value.clone()), accumulator;
        }, []);
        sortedPoints.sort((a, b) => b.arr[1] - a.arr[1]).sort((a, b) => b.arr[0] - a.arr[0]);
        let referencePoint = sortedPoints.pop();
        sortedPoints.sort((a, b) => {
            let result = Utilities.cross2D(new Point2D(a.arr[0] - referencePoint.arr[0], a.arr[1] - referencePoint.arr[1]), new Point2D(b.arr[0] - referencePoint.arr[0], b.arr[1] - referencePoint.arr[1]));
            if (result === 0) {
                return Utilities.pythagorean(a, referencePoint) - Utilities.pythagorean(b, referencePoint);
            }
            else {
                return result > 0 ? 1 : -1;
            }
        });
        sortedPoints.unshift(referencePoint);
        for (let i = 0; i < sortedPoints.length; i++) {
            let point = sortedPoints[i];
            if (stack.length > 1) {
                while (stack.length > 1 && Utilities.pointOrientation(stack[1], stack[0], point) <= 0) {
                    stack.shift();
                }
            }
            stack.unshift(point);
        }
        return stack;
    }
    /**
     *
     *
     * @param convexHull
     */
    static minimumBoundingBox(convexHull) {
        let bestArea = Number.MAX_VALUE;
        if (convexHull.length === 1) {
            return new BoundingBox2D(convexHull[0], convexHull[0], convexHull[0], convexHull[0]);
        }
        let bestBox = new BoundingBox2D(new Point2D(0, 0), new Point2D(0, 0), new Point2D(0, 0), new Point2D(0, 0));
        let center = Utilities.pointCenter(convexHull);
        let cx = center.arr[0];
        let cy = center.arr[1];
        for (let i = 0; i < convexHull.length - 1; i++) {
            let currentPoint = convexHull[i];
            let nextPoint = convexHull[i + 1];
            const angle = Math.atan2((nextPoint.arr[1] - currentPoint.arr[1]), (nextPoint.arr[0] - currentPoint.arr[0]));
            let currentBox = new BoundingBox2D(new Point2D(Number.MAX_VALUE, Number.MAX_VALUE), new Point2D(-Number.MAX_VALUE, Number.MAX_VALUE), new Point2D(Number.MAX_VALUE, -Number.MAX_VALUE), new Point2D(-Number.MAX_VALUE, -Number.MAX_VALUE));
            convexHull.reduce((accumulator, current) => {
                let rotatedPoint = Utilities.rotatePoint(current, center, angle);
                const px = rotatedPoint.arr[0];
                const py = rotatedPoint.arr[1];
                if (px <= currentBox.BL.arr[0] && py <= currentBox.BL.arr[1]) {
                    currentBox.BL = new Point2D(current.arr[0], current.arr[1]);
                }
                if (px >= currentBox.BR.arr[0] && py <= currentBox.BR.arr[1]) {
                    currentBox.BR = new Point2D(current.arr[0], current.arr[1]);
                }
                if (px <= currentBox.UL.arr[0] && py >= currentBox.UL.arr[1]) {
                    currentBox.UL = new Point2D(current.arr[0], current.arr[1]);
                }
                if (px >= currentBox.UR.arr[0] && py >= currentBox.UR.arr[1]) {
                    currentBox.UR = new Point2D(current.arr[0], current.arr[1]);
                }
                return accumulator.push(rotatedPoint), accumulator;
            }, []);
            let currentArea = (currentBox.BR.arr[0] - currentBox.BL.arr[0]) * (currentBox.BR.arr[1] - currentBox.BL.arr[1]);
            if (currentArea < bestArea) {
                bestBox = currentBox;
                bestArea = currentArea;
            }
        }
        return bestBox;
    }
    static convertDimensionHigher(p, insertionIndex, insertionValue, currentDimension) {
        let x = [...p.arr];
        x.splice(insertionIndex, 0, insertionValue);
        return PointFactoryMethods.getFactoryMethod(currentDimension + 1)(x);
    }
    static printPointList(p) {
        let str = "[";
        for (let i = 0; i < p.length; i++) {
            if (i != 0) {
                str += ",";
            }
            str += p[i].toPrint();
        }
        return str + "]";
    }
    static printPointListDesmos(p) {
        let str = "";
        for (let i = 0; i < p.length; i++) {
            if (i != 0) {
                str += ",";
            }
            str += p[i].toPrint().replace("[", "(").replace("]", ")");
        }
        return str + "";
    }
}

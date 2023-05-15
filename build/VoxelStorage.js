import { VoxelStorageNode } from "./VoxelStorageNode.js";
import { BinaryTree } from "./BinaryTree.js";
import { VoxelStorageComparator } from "./VoxelStorageComparator.js";
import { Point3D } from "./Point3D.js";
export class VoxelStorage {
    dimensionRange = new Map();
    root = new BinaryTree(undefined, new VoxelStorageComparator());
    maxDepth = -1;
    constructor(maxDepth) {
        if (maxDepth < 1) {
            throw new Error("Invalid Depth: Can not be less than 1");
        }
        this.maxDepth = maxDepth;
        for (let i = 0; i < this.maxDepth; i++) {
            this.dimensionRange.set(i, [Number.MAX_SAFE_INTEGER, 0, Number.MIN_SAFE_INTEGER, 0]);
        }
    }
    getDepth() {
        let depth = 0;
        let current = this.root.getRoot();
        while (current != undefined) {
            depth++;
            if (current.getValue() === undefined) {
                return depth;
            }
            current = current.getValue().getBinarySubTreeRoot();
        }
        return depth;
    }
    findRangeRecursiveCall(currentNode, range, depth, limitingDepth, useInclusiveRanges, inclusiveRanges) {
        if (!useInclusiveRanges || depth === inclusiveRanges[inclusiveRanges.length - 1]) {
            if (useInclusiveRanges) {
                // n is the length of the initial inclusiveRanges aray
                // Removing from end of array is o(1), so o(n) for all range values;
                // Instead of shift that will be o(n^2).
                inclusiveRanges?.pop();
            }
            const amount = currentNode.getAmount();
            const currentValue = range.get(depth);
            if (amount < currentValue[0]) {
                currentValue[0] = amount;
                currentValue[1] = 1;
            }
            if (amount === currentValue[0]) {
                currentValue[1] += 1;
            }
            if (amount > currentValue[2]) {
                currentValue[2] = amount;
                currentValue[3] = 1;
            }
            if (amount === currentValue[2]) {
                currentValue[3] += 1;
            }
        }
        if (currentNode.hasRight()) {
            let rightSubTree = currentNode.getRight();
            this.findRangeRecursiveCall(rightSubTree, range, depth, limitingDepth, useInclusiveRanges, inclusiveRanges);
        }
        if (currentNode.hasLeft()) {
            let leftSubTree = currentNode.getLeft();
            this.findRangeRecursiveCall(leftSubTree, range, depth, limitingDepth, useInclusiveRanges, inclusiveRanges);
        }
        if (depth < limitingDepth) {
            let downwardSubTree = currentNode.getValue().getBinarySubTreeRoot();
            this.findRangeRecursiveCall(downwardSubTree, range, ++depth, limitingDepth, useInclusiveRanges, inclusiveRanges);
        }
    }
    findRangeInclusive(inclusiveRange, range) {
        return this.#findRange(true, inclusiveRange, -1, range);
    }
    findRangeExclusive(maxDepth, range) {
        return this.#findRange(true, [], maxDepth, range);
    }
    #findRange(useInclusive, inclusiveRange, exclusiveDepth, range) {
        if (exclusiveDepth > this.maxDepth) {
            throw new Error(`Invalid tree height for range call: ${exclusiveDepth} greater than this.maxDepth ${this.maxDepth}`);
        }
        range = range === undefined ? new Map() : range;
        if (!useInclusive) {
            for (let i = 0; i < exclusiveDepth; i++) {
                range.set(i, [Number.MAX_SAFE_INTEGER, 0, Number.MIN_SAFE_INTEGER, 0]);
            }
        }
        else {
            inclusiveRange = inclusiveRange?.sort((a, b) => b - a);
            if (inclusiveRange[0] > this.maxDepth) {
                throw new Error(`Inclusive Ranges depth too large: ${JSON.stringify(range)}`);
            }
            for (let i = 0; i < inclusiveRange.length; i++) {
                let rangeNumber = inclusiveRange[i];
                range.set(rangeNumber, [Number.MAX_SAFE_INTEGER, 0, Number.MIN_SAFE_INTEGER, 0]);
            }
        }
        this.findRangeRecursiveCall(this.root.getRoot(), range, 0, exclusiveDepth, useInclusive, inclusiveRange);
        return range;
    }
    getMaxDepth() {
        return this.maxDepth;
    }
    hasCoordinate(coordinate) {
        const { arr } = coordinate;
        let nodeToFind = new VoxelStorageNode(arr[0]);
        if (!this.root.hasItem(nodeToFind)) {
            return false;
        }
        let currentTree = this.root.getItem(nodeToFind).getValue();
        for (let i = 1; i < arr.length; i++) {
            if (currentTree.hasItem(arr[i])) {
                currentTree = currentTree.getItem(arr[i]).getValue();
            }
            else {
                return false;
            }
        }
        return true;
    }
    addCoordinate(coordinate) {
        const { arr } = coordinate;
        var currentNode;
        for (let i = 0; i < arr.length; i++) {
            const range = this.dimensionRange.get(i);
            if (i < range[0]) {
                range[0] = i;
                range[1] = 1;
            }
            if (i === range[0]) {
                range[1] += 1;
            }
            if (i > range[2]) {
                range[2] = i;
                range[3] = 1;
            }
            if (i === range[2]) {
                range[3] += 1;
            }
            const nodeToAdd = new VoxelStorageNode(arr[i]);
            if (i == 0) {
                this.root.addItem(nodeToAdd);
                currentNode = this.root.getItem(nodeToAdd).getValue();
            }
            else {
                currentNode.addItem(arr[i]);
                currentNode = currentNode.getItem(arr[i]).getValue();
            }
        }
        if (!this.root.hasItem(new VoxelStorageNode(arr[0]))) {
            throw new Error("Internal Error");
        }
    }
    removeCoordinate(coordinate) {
        if (!this.hasCoordinate(coordinate)) {
            throw new Error("Coordinate does not exist");
        }
        const { arr } = coordinate;
        const rangeList = [];
        let nodeToFind = new VoxelStorageNode(arr[0]);
        let nodeToReduce = this.root.getItem(nodeToFind);
        if (nodeToReduce.getAmount() === 1) {
            rangeList.push(0);
        }
        let currentTree = this.root.removeItem(nodeToFind).getValue();
        for (let i = 1; i < arr.length; i++) {
            nodeToReduce = currentTree.getItem(arr[i]);
            if (nodeToReduce.getAmount() === 1) {
                rangeList.push(i);
            }
            currentTree = currentTree.removeItem(arr[i]).getValue();
        }
        if (rangeList.length > 0) {
            this.findRangeInclusive(rangeList, this.dimensionRange);
        }
    }
    /**
     * @TODO fix the allCoordinates.push with constructor
     * @param currentNode
     * @param currentCoordinate
     * @param allCoordinates
     * @param depth
     * @returns
     */
    #getCoordinatesRecursiveCall(currentNode, currentCoordinate, allCoordinates, depth) {
        if (currentNode.hasRight()) {
            let rightSubTree = currentNode.getRight();
            this.#getCoordinatesRecursiveCall(rightSubTree, [...currentCoordinate], allCoordinates, depth);
        }
        if (currentNode.hasLeft()) {
            let leftSubTree = currentNode.getLeft();
            this.#getCoordinatesRecursiveCall(leftSubTree, [...currentCoordinate], allCoordinates, depth);
        }
        if (depth >= this.maxDepth) {
            currentCoordinate.push(currentNode.getValue().getData());
            for (let i = currentNode.getAmount(); i > 0; i--) {
                // allCoordinates.push((new this.construct(...currentCoordinate)));
            }
            return;
        }
        else {
            currentCoordinate.push(currentNode.getValue().getData());
            let downwardSubTree = currentNode.getValue().getBinarySubTreeRoot();
            this.#getCoordinatesRecursiveCall(downwardSubTree, [...currentCoordinate], allCoordinates, ++depth);
        }
    }
    getCoordinateList() {
        if (this.root.getRoot() === undefined) {
            return [];
        }
        let allCoordinates = [];
        this.#getCoordinatesRecursiveCall(this.root.getRoot(), [], allCoordinates, 1);
        return allCoordinates;
    }
    getBoundingBox() {
        if (this.maxDepth < 3) {
            throw new Error("Storage tree depth is less than 3: " + this.maxDepth);
        }
        let xRange = this.dimensionRange.get(0);
        let yRange = this.dimensionRange.get(1);
        let zRange = this.dimensionRange.get(2);
        return {
            "0": new Point3D(xRange[0], yRange[0], zRange[0]),
            "1": new Point3D(xRange[2], yRange[0], zRange[0]),
            "2": new Point3D(xRange[0], yRange[2], zRange[0]),
            "3": new Point3D(xRange[2], yRange[2], zRange[0]),
            "4": new Point3D(xRange[0], yRange[0], zRange[2]),
            "5": new Point3D(xRange[2], yRange[0], zRange[2]),
            "6": new Point3D(xRange[0], yRange[2], zRange[2]),
            "7": new Point3D(xRange[2], yRange[2], zRange[2])
        };
    }
    preHash() {
        return this;
    }
    toPrint() {
        return "";
    }
}

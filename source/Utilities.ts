import { Point } from "./Point.js";
import { HashStorage } from "./HashStorage.js";
import { VoxelStorage } from "./VoxelStorage.js";
import { Point2D } from "./Point2D.js";
import { Point3D } from "./Point3D.js";
import { DimensionalAnalyzer } from "./DimensionalAnalyzer.js";
import { PointFactoryMethods } from "./PointFactoryMethods.js";
import { BoundingBox2D } from "./BoundingBox2D.js";

export class Utilities {
   static pythagorean(p1: Point, p2: Point): number {
      if (p1.dimensionCount() != p2.dimensionCount() || p1.dimensionCount() === 0 || p2.dimensionCount() === 0) {
         throw new Error(`Dimensions are not the same or dimension count is zero: p1 ${p1.dimensionCount()} verse p2 ${p2.dimensionCount()}`)
      }
      let d = 0;
      for (let i = 0; i < p1.dimensionCount(); i++) {
         d += Math.pow(Math.abs(p1.arr[i] - p2.arr[i]), 2)
      }
      return Math.sqrt(d);
   }
   static bresenham(p1: Point, p2: Point, returnType: number): Point[] | VoxelStorage<Point> | HashStorage<Point> {
      if (p1.dimensionCount() != p2.dimensionCount() || p1.dimensionCount() === 0 || p2.dimensionCount() === 0) {
         throw new Error(`Dimensions are not the same or dimension count is zero: p1 ${p1.dimensionCount()} verse p2 ${p2.dimensionCount()}`)
      }
      let coordinates: Point[] = []
      let voxelStorage: VoxelStorage<Point> = new VoxelStorage<Point>(p1.dimensionCount())
      let hashStorage: HashStorage<Point> = new HashStorage<Point>(p1.dimensionCount())
      let flag: boolean = true;
      for (let i = 0; i < p1.dimensionCount(); i++) {
         if (p1.arr[i] != p2.arr[i]) {
            flag = false;
         }
      }
      if (flag) {
         if (returnType === 0) {
            return [p1];
         } else if (returnType === 1) {
            voxelStorage.addCoordinate(p1, false);
            return voxelStorage;
         } else {
            hashStorage.addCoordinate(p1, false);
            return hashStorage;
         }
      }
      const startPoint: number[] = p1.arr;
      const endPoint: number[] = p2.arr;
      const currentPoint: number[] = [...startPoint];
      const differences: number[] = []
      const increments: number[] = []
      let indexOfGreatest: number = 0;
      const dimensions = p1.dimensionCount();
      for (let i = 0; i < dimensions; i++) {
         differences.push(Math.abs(endPoint[i] - startPoint[i]));
         if (endPoint[i] - startPoint[i] < 0) {
            increments.push(-1);
         } else {
            increments.push(1);
         }
         if (differences[i] > differences[indexOfGreatest]) {
            indexOfGreatest = i;
         }
      }
      let steppingValues: number[] = [];
      for (let i = 0; i < dimensions; i++) {
         steppingValues.push(2 * differences[i] - differences[indexOfGreatest]);
      }
      while (true) {
         if (!(startPoint[indexOfGreatest] < endPoint[indexOfGreatest] ? (currentPoint[indexOfGreatest] <= endPoint[indexOfGreatest]) : (currentPoint[indexOfGreatest] >= endPoint[indexOfGreatest]))) {
            if (returnType === 0) {
               return coordinates
            } else if (returnType === 1) {
               return voxelStorage;
            } else {
               return hashStorage;
            }
         }
         if (returnType === 0) {
            coordinates.push(p1.factoryMethod([...currentPoint]))
         } else if (returnType === 1) {
            voxelStorage.addCoordinate(p1.factoryMethod([...currentPoint]), false)
         } else {
            hashStorage.addCoordinate(p1.factoryMethod([...currentPoint]), false)
         }
         for (let i = 0; i < dimensions; i++) {
            if (i === indexOfGreatest) {
               continue;
            }
            else if (steppingValues[i] < 0) {
               steppingValues[i] += (2 * differences[i]);
            } else {
               currentPoint[i] += increments[i];
               steppingValues[i] += ((2 * differences[i]) - (2 * differences[indexOfGreatest]));
            }
         }
         currentPoint[indexOfGreatest] += increments[indexOfGreatest];
      }
   }

   static pythagoreanSort(points: Point[], referencePoint: Point): Point[] {
      return points.sort((a, b) => Utilities.pythagorean(referencePoint, a) - Utilities.pythagorean(referencePoint, b))
   }

   static #radToDegConstant = 180 / Math.PI
   /**
    * Polar sorts a given list of points. If any amount of points share the same polar angle, the furthest polar point is kept.
    * 
    * @param points 
    */
   static polarSort(points: Point2D[], removeCollinear: boolean, referencePoint: Point | undefined): Point2D[] {
      let sortedPoints: Point2D[] = points.reduce((accumulator: Point2D[], cv: Point2D) => {
         return accumulator.push(cv.clone()), accumulator
      }, []).sort((a: Point2D, b: Point2D) => a.arr[1] - b.arr[1]).sort((a: Point2D, b: Point2D) => a.arr[0] - b.arr[0])
      const assertedRF: Point = referencePoint == undefined ? sortedPoints[0] : referencePoint
      const polarMap: Map<number, Point[]> = new Map<number, Point[]>()
      sortedPoints.forEach((value) => {
         let angle = Math.atan2((value.arr[1] - assertedRF.arr[1]), (value.arr[0] - assertedRF.arr[0])) * Utilities.#radToDegConstant;
         angle += angle < 0 ? 360 : 0
         polarMap.has(angle) ? polarMap.get(angle)?.push(value) : polarMap.set(angle, [value])
      })
      if (removeCollinear) {
         polarMap.forEach((value, key) => {
            value = [Utilities.pythagoreanSort(value, assertedRF)[0]]
         })
      }
      let sortedKeys: number[] = (Object.keys(polarMap) as string[]).map(value => Number(value)).sort((a, b) => a - b) as number[]
      let returnPoints: Point2D[] = []
      sortedKeys.forEach(value => returnPoints.push((polarMap.get(value) as Point2D[])[0]))
      return returnPoints;
   }

   static pointOrientation = (p1: Point2D, p2: Point2D, p3: Point2D): number => {
      // returns slope from p1 to p2 minus p2 to p3
      return ((p2.arr[1] - p1.arr[1]) * (p3.arr[0] - p2.arr[0])) - ((p2.arr[0] - p1.arr[0]) * (p3.arr[1] - p1.arr[1]));
   }

   static cross2D = (p1: Point2D, p2: Point2D): number => {
      return (p1.arr[0] * p2.arr[1]) - (p2.arr[0] * p1.arr[1])
   }

   static convexHull(inputPoints: Point2D[]): Point2D[] {
      let stack: Point2D[] = [];
      // Sort the data set from lowest x value to highest
      let sortedPoints = inputPoints.reduce((accumulator, value) => {
         return accumulator.push(value.clone()), accumulator
      }, [] as Point2D[])
      sortedPoints.sort((a, b) => b.arr[1] - a.arr[1]).sort((a, b) => b.arr[0] - a.arr[0])
      let referencePoint: Point2D = sortedPoints.pop() as Point2D
      sortedPoints.sort((a, b) => {
         let result = Utilities.cross2D(new Point2D(a.arr[0] - referencePoint.arr[0], a.arr[1] - referencePoint.arr[1]), new Point2D(b.arr[0] - referencePoint.arr[0], b.arr[1] - referencePoint.arr[1]))
         if (result === 0) {
            return Utilities.pythagorean(a, referencePoint) - Utilities.pythagorean(b, referencePoint)
         } else {
            return result > 0 ? 1 : -1
         }
      })
      sortedPoints.unshift(referencePoint)
      for (let i = 0; i < sortedPoints.length; i++) {
         let point: Point2D = sortedPoints[i];
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
   static minimumBoundingBox(convexHull: Point2D[]): BoundingBox2D {
      let bestArea = Number.MAX_VALUE
      if (convexHull.length === 1) {
         return {
            "0": convexHull[0].clone(),
            "1": convexHull[0].clone(),
            "2": convexHull[0].clone(),
            "3": convexHull[0].clone()
         } as BoundingBox2D
      }
      let bestBox = {
         "0": new Point2D(0, 0),
         "1": new Point2D(0, 0),
         "2": new Point2D(0, 0),
         "3": new Point2D(0, 0),
      } as BoundingBox2D
      let center = new Point2D(0, 0)
      convexHull.forEach(value => {
         center.arr[0] += value.arr[0]
         center.arr[1] += value.arr[1]
      })
      center.arr[0] /= convexHull.length
      center.arr[1] /= convexHull.length
      let cx = center.arr[0]
      let cy = center.arr[1]
      for (let i = 0; i < convexHull.length - 1; i++) {
         let currentPoint: Point2D = convexHull[i]
         let nextPoint: Point2D = convexHull[i + 1]
         const angle = Math.atan2((nextPoint.arr[1] - currentPoint.arr[1]), (nextPoint.arr[0] - currentPoint.arr[0]))
         let currentBox = {
            "0": new Point2D(Number.MAX_VALUE, Number.MAX_VALUE),
            "1": new Point2D(-Number.MAX_VALUE, Number.MAX_VALUE),
            "2": new Point2D(Number.MAX_VALUE, -Number.MAX_VALUE),
            "3": new Point2D(-Number.MAX_VALUE, -Number.MAX_VALUE),
         } as BoundingBox2D
         convexHull.reduce((accumulator, current) => {
            let clonedPoint = current.clone();
            let px = clonedPoint.arr[0] - cx;
            let py = clonedPoint.arr[1] - cy;
            // 2D rotation matrix application
            clonedPoint.arr[0] = ((px * Math.cos(angle)) - (py * Math.sin(angle))) + cx;
            clonedPoint.arr[1] = ((px * Math.sin(angle)) + (py * Math.cos(angle))) + cy;
            px = clonedPoint.arr[0];
            py = clonedPoint.arr[1];
            if (px <= currentBox["0"].arr[0] && py <= currentBox["0"].arr[1]) {
               currentBox["0"] = new Point2D(current.arr[0], current.arr[1]);
            }
            if (px >= currentBox["1"].arr[0] && py <= currentBox["1"].arr[1]) {
               currentBox["1"] = new Point2D(current.arr[0], current.arr[1]);
            }
            if (px <= currentBox["2"].arr[0] && py >= currentBox["2"].arr[1]) {
               currentBox["2"] = new Point2D(current.arr[0], current.arr[1]);
            }
            if (px >= currentBox["3"].arr[0] && py >= currentBox["3"].arr[1]) {
               currentBox["3"] = new Point2D(current.arr[0], current.arr[1]);
            }
            return accumulator.push(clonedPoint), accumulator;
         }, [] as Point2D[])
         let currentArea = (currentBox["1"].arr[0] - currentBox["0"].arr[0]) * (currentBox["1"].arr[1] - currentBox["0"].arr[1])
         if (currentArea < bestArea) {
            bestBox = currentBox
            bestArea = currentArea
         }
      }
      return bestBox;
   }
   static convertDimensionHigher(p: Point, insertionIndex: number, insertionValue: number, currentDimension: number): Point {
      let x = [...p.arr];
      x.splice(insertionIndex, 0, insertionValue)
      return PointFactoryMethods.getFactoryMethod(currentDimension + 1)(x)
   }
   static printPointList(p: Point[]) {
      let str = "["
      for (let i = 0; i < p.length; i++) {
         if (i != 0) {
            str += ","
         }
         str += p[i].toPrint()
      }
      return str + "]"
   }
   static printPointListDesmos(p: Point[]) {
      let str = ""
      for (let i = 0; i < p.length; i++) {
         if (i != 0) {
            str += ","
         }
         str += p[i].toPrint().replace("[", "(").replace("]", ")")
      }
      return str + ""
   }
}
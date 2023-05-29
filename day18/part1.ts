import input from './input';

type CubeCoordinate = {
    x: number,
    y: number,
    z: number
};

type CubeCollection = Array<CubeCoordinate>;

function parseInput(input: string): CubeCollection {
    const lines = input.split('\n');
    const result: CubeCollection = [];

    for (const line of lines) {
        const [x,y,z] = line.split(',');
        result.push({
            x: parseInt(x, 10), 
            y: parseInt(y, 10), 
            z: parseInt(z, 10)
        });
    }

    return result;
}

type Axis = 'x' | 'y' | 'z';
type AxisPairing = ['x', 'y'] | ['x', 'z'] | ['y', 'z'];

type CoordinateGrouping = {
    axisGroup: Axis,
    axisPair: AxisPairing,
    mapping: { // basically map of AxisPair coordinate to Axis coordinate
        [pair: string]: Array<number>
    }
}

function getComplementaryAxis(pair: AxisPairing) {    
    if (pair[0] === 'x' && pair[1] === 'y') {
        return 'z';
    } else if (pair[0] === 'x' && pair[1] === 'z') {
        return 'y';
    } else {
        return 'x';
    }
}


function generateGrouping(cubes: CubeCollection, axisPair: AxisPairing): CoordinateGrouping {
    const axisGroup = getComplementaryAxis(axisPair);
    const grouping: CoordinateGrouping = {
        axisPair,
        axisGroup,
        mapping: {}
    };

    const axis1 = axisPair[0];
    const axis2 = axisPair[1];

    for (const coordinate of cubes) {        
        const pair = `${coordinate[axis1]},${coordinate[axis2]}`;
        const complement = coordinate[axisGroup];
        (grouping.mapping[pair] ??= []).push(complement);        
    }

    // at the end, sort all the arrays
    for (const pair in grouping.mapping) {
        grouping.mapping[pair].sort((a, b) => a - b);
    }

    return grouping;
}

function calculateSharedFaces(grouping: CoordinateGrouping): number {
    let sharedFaces = 0;    
    for (const coordinatePair in grouping.mapping) {
        // for each coordinate pair, each consecutive pair
        // in the complementary axis means a shared face
        //
        // e.g. for the coordinate pair {x: 1, y: 1},
        // if the complementary axis z has [1,2,3,5]
        // there are 2 consecutive pairs, [1,2] and [2,3]
        // thus, there are 2 shared faces.
        const sequence = grouping.mapping[coordinatePair];   
        for (let i = 1; i < sequence.length; i += 1) {
            if (sequence[i] === sequence[i-1] + 1) {
                sharedFaces += 1;
            }
        }
    }

    return sharedFaces;

}

function solve(cubes: CubeCollection): number {
    const xyGrouping = generateGrouping(cubes, ['x', 'y']);
    const xzGrouping = generateGrouping(cubes, ['x', 'z']);
    const yzGrouping = generateGrouping(cubes, ['y', 'z']);

    const xyShared = calculateSharedFaces(xyGrouping);
    const xzShared = calculateSharedFaces(xzGrouping);
    const yzShared = calculateSharedFaces(yzGrouping);

    return cubes.length * 6 - (xyShared + xzShared + yzShared) * 2;
}

export default function() {
    const cubes = parseInput(input);
    const surfaceArea = solve(cubes);

    console.log('total cubes = ', cubes.length);
    console.log('surface area = ', surfaceArea)

    return { cubes, surfaceArea };
}
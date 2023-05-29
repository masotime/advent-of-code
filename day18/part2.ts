import input from './input';

type CubeCoordinate = {
    x: number,
    y: number,
    z: number
};

type CubeCollection = Array<CubeCoordinate>;
type CubeGrid = {
    [x in number]: {
        [y in number]: {
            [z in number]: boolean
        }
    }
};
type Boundary = {
    min: number,
    max: number
};

type LavaDroplet = {
    grid: CubeGrid,
    cubes: CubeCollection,
    x: Boundary,
    y: Boundary,
    z: Boundary
}

function parseInput(input: string): LavaDroplet {
    const lines = input.split('\n');
    const result: LavaDroplet = {
        grid: {},
        cubes: [],
        x: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
        y: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
        z: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER }
    };

    for (const line of lines) {
        const [x,y,z] = line.split(',').map(_ => parseInt(_, 10));
        result.cubes.push({ x, y, z });

        // mark the cube on the grid
        result.grid[x] ??= {};
        result.grid[x][y] ??= {};
        result.grid[x][y][z] = true;

        // update boundaries if necessary
        result.x.min = Math.min(result.x.min, x);
        result.x.max = Math.max(result.x.max, x);
        result.y.min = Math.min(result.y.min, y);
        result.y.max = Math.max(result.y.max, y);
        result.z.min = Math.min(result.z.min, z);
        result.z.max = Math.max(result.z.max, z);
    }

    return result;
}

type Axis = 'x' | 'y' | 'z';

/*** START: PART I CODE ***/
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

// from part 1
function getSurfaceArea(cubes: Array<CubeCoordinate>): number {
    const xyGrouping = generateGrouping(cubes, ['x', 'y']);
    const xzGrouping = generateGrouping(cubes, ['x', 'z']);
    const yzGrouping = generateGrouping(cubes, ['y', 'z']);

    // console.log(xyGrouping);
    // console.log(xzGrouping);
    // console.log(yzGrouping);

    const xyShared = calculateSharedFaces(xyGrouping);
    const xzShared = calculateSharedFaces(xzGrouping);
    const yzShared = calculateSharedFaces(yzGrouping);

    return cubes.length * 6 - (xyShared + xzShared + yzShared) * 2;
}

/*** END: PART I CODE ***/

/*** START: PART 2 CODE ***/

function isOccupied(grid: CubeGrid, coord: CubeCoordinate): boolean {
    const { x, y, z } = coord;
    return grid[x] && grid[x][y] && grid[x][y][z] === true;
}

function setOccupied(grid: CubeGrid, coord: CubeCoordinate) {
    const { x, y, z } = coord;
    grid[x] ??= {};
    grid[x][y] ??= {};
    grid[x][y][z] = true;
}

function isOutsideBoundary(coord: CubeCoordinate, droplet: LavaDroplet) {
    const {x, y, z} = droplet;

    return (coord.x < x.min || coord.x > x.max)
        || (coord.y < y.min || coord.y > y.max)
        || (coord.z < z.min || coord.z > z.max);
}

function findSpaces(droplet: LavaDroplet, visited: CubeGrid, coord: CubeCoordinate): Array<CubeCoordinate> {
    // find all valid empty spaces around coord
    const { grid } = droplet;

    // we don't consider diagonal moves - a cube is "surrounded" / air pocket
    // if up, down vertical dimensions and all 4 horizontal dimentions are blocked
    const permutations: Array<CubeCoordinate> = [
        { x: coord.x + 1, y: coord.y, z: coord.z},
        { x: coord.x - 1, y: coord.y, z: coord.z},
        { x: coord.x, y: coord.y + 1, z: coord.z},
        { x: coord.x, y: coord.y - 1, z: coord.z},
        { x: coord.x, y: coord.y, z: coord.z + 1},
        { x: coord.x, y: coord.y, z: coord.z - 1},
    ];

    const validPermutations = permutations.filter(coordinate => {
        // exclude any visited spot or spot already occupied
        return !isOccupied(grid, coordinate) && !isOccupied(visited, coordinate);
    });

    return validPermutations;
}

type Pocket = Array<CubeCoordinate>;

function mapPocket(droplet: LavaDroplet, start: CubeCoordinate): Pocket | void {
    const maybePocket: Pocket = [];
    const searchSpace: Array<CubeCoordinate> = [start];
    const mapped: CubeGrid = {}; // maintain a separate one, don't update the global visited which complicates things
    setOccupied(mapped, start);    

    while (searchSpace.length > 0) {
        const coordinate = searchSpace.shift() as CubeCoordinate;
        maybePocket.push(coordinate);

        const candidates = findSpaces(droplet, mapped, coordinate);
        // console.log('candidates are', candidates);
        const outsideCandidate = candidates.find(_ => isOutsideBoundary(_, droplet));

        if (outsideCandidate) {
            // console.log('failed, a candidate', outsideCandidate, 'is outside')
            return undefined; // this cannot be a pocket
        }

        for (const candidate of candidates) {
            searchSpace.push(candidate);
            setOccupied(mapped, candidate);
        }
    }
    
    return maybePocket;
}

function findPockets(droplet: LavaDroplet): Array<Pocket> {
    const result: Array<Pocket> = [];
    const visited: CubeGrid = {};
    
    // walk through the entire space occupied by the droplet. if it
    // is neither visited nor blocked by the droplet, perform
    // a DFS to map out a potential pocket (or give up if the DFS)
    // exceeds the boundaries of the droplet grid
    const { x: xBounds, y: yBounds, z: zBounds, grid } = droplet;

    for (let x = xBounds.min; x <= xBounds.max; x += 1) {
        for (let y = yBounds.min; y <= yBounds.max; y += 1) {
            for (let z = zBounds.min; z <= zBounds.max; z += 1) {
                const possiblyPocket = !isOccupied(grid, { x, y, z }) && !isOccupied(visited, { x, y, z });                
                if (possiblyPocket) {
                    // console.log('considering if ', {x,y,z},' might be part of a pocket');
                    const pocket = mapPocket(droplet, { x, y, z });
                    if (pocket) {
                        result.push(pocket);

                        // the pocket should all be marked as visited
                        for (const coord of pocket) {
                            setOccupied(droplet.grid, coord);
                        }
                    }
                }
            }
        }
    }

    return result;
}

/*** END: PART 2 CODE ***/
export default function() {
    const droplet = parseInput(input);
    const surfaceArea = getSurfaceArea(droplet.cubes);

    console.log({xBounds: droplet.x, yBounds: droplet.y, zBounds: droplet.z});

    console.log('total cubes = ', droplet.cubes.length);
    console.log('surface area = ', surfaceArea);

    const pockets = findPockets(droplet);

    console.log('pockets found = ', pockets);
    const pocketSurfaceArea = pockets.reduce((surfaceArea, pocket) => {
        return surfaceArea + getSurfaceArea(pocket)
    }, 0);
    console.log({ pocketSurfaceArea });

    // for each of the cubes found in the pockets,
    // mark them all as "blocked off" in the droplet
    // then recalculate the surface area
    for (const pocket of pockets) {
        for (const coordinate of pocket) {
            const { x, y, z } = coordinate;
            droplet.cubes.push(coordinate);

            // mark the cube on the grid
            droplet.grid[x] ??= {};
            droplet.grid[x][y] ??= {};
            droplet.grid[x][y][z] = true;
        }
    }

    // sanity check - there should be no more pockets
    const afterPockets = findPockets(droplet);
    console.log({ afterPockets });

    const externalSurfaceArea = getSurfaceArea(droplet.cubes);

    return { cubes: droplet.cubes, surfaceArea, externalSurfaceArea };
}
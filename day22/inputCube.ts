import type { Board, Coordinate, CubeDefinition, Region, RegionCoord, RegionTransform, Direction } from './part2';

//
//    0 1 2
//  +-------+
// 0|   1 2 |
// 1|   3   |
// 2| 4 5   |
// 3| 6     |
//  +-------+
const regionAndDirectionToRegion: { [R in Region]: { [D in Direction]: Region }} = {
    1: { '^': 6, '>': 2, 'v': 3, '<': 4 },
    2: { '^': 6, '>': 5, 'v': 3, '<': 1 },
    3: { '^': 1, '>': 2, 'v': 5, '<': 4 },
    4: { '^': 3, '>': 5, 'v': 6, '<': 1 },
    5: { '^': 3, '>': 2, 'v': 6, '<': 4 },
    6: { '^': 4, '>': 5, 'v': 2, '<': 1 },    
};

const getRegionSize = (board: Board) => {
    const allTheColMaxes = Object.values(board.rowLimits).map(_ => _.max);
    const columnCount = Math.max(...allTheColMaxes) + 1;

    // we are making use of the fact that we know that the columns show 3 faces across
    //
    //    0 1 2
    //  +-------+
    // 0|   1 2 |
    // 1|   3   |
    // 2| 4 5   |
    // 3| 6     |
    //  +-------+
    const regionSize = columnCount / 3;
    return regionSize;
};

//
//    0 1 2
//  +-------+
// 0|   1 2 |
// 1|   3   |
// 2| 4 5   |
// 3| 6     |
//  +-------+
const coordinateToRegion: { [row in 0|1|2|3 ]: { [col in 0|1|2]?: Region }} = {
    0: { 1: 1, 2: 2 },
    1: { 1: 3 },
    2: { 0: 4, 1: 5 },
    3: { 0: 6 }
};

const createRegionCalculator = (board: Board) => {
    const regionSize = getRegionSize(board);

    // regionSize is the "modulo", we can use it to determine which region
    // a coordinate is in. e.g. in a 16 x 12 grid, the face size is 4 (=(15+1)/4)
    // the coordinate 3 would be normalized to floor(3/4) = 0. 10 would be floor(10/4) = 2
    // using the normalized values, we can determine the region quickly.    
    return (coord: Coordinate) => {
        const { row, col } = coord;
        const normalizedRow = Math.floor(row / regionSize);
        const regionRow = row % regionSize;
        const normalizedCol = Math.floor(col / regionSize);
        const regionCol = col % regionSize;

        const region = coordinateToRegion[normalizedRow as 0|1|2|3][normalizedCol as 0|1|2];

        if (!region) {
            throw new Error(`Couldn't find a region for [${row}, ${col}] with regionSize ${regionSize}`);
        }

        return { region, coord: { row: regionRow, col: regionCol }, size: regionSize };
    };
}

// this is fine
const regionToNormalizedCoordinate: { [region in Region]: Coordinate } = {
    1: { row: 0, col: 1 },
    2: { row: 0, col: 2 },
    3: { row: 1, col: 1 },
    4: { row: 2, col: 0 },
    5: { row: 2, col: 1 },
    6: { row: 3, col: 0 },
}

// this is seriously f***ed up
function regionTransformer(from: RegionCoord, to: Region, direction: Direction): RegionTransform {
    // so the complicated part here is that moving from one face to another, it's
    // possible for both the direction and the row/col values to swap, we need to handle it for every
    // case
    let newDirection = direction;
    let newRow, newCol;
    let maxIdx = from.size - 1;

    const invert = (coordIdx: number) => maxIdx - coordIdx;
    
    // these are all manually interpreted by inspecting a physical cube 😭
    switch (from.region) {
        case 1:
            if (to === 6) { //
                newDirection = '>';
                newRow = from.coord.col;
                newCol = 0;                
            } else if (to === 2) { //
                newDirection = '>';
                newRow = from.coord.row;
                newCol = 0;
            } else if (to === 3) {
                newDirection = 'v';
                newRow = 0;
                newCol = from.coord.col;
            } else if (to === 4) { //
                newDirection = '>';
                newRow = invert(from.coord.row);
                newCol = 0;
            }
            break;
        case 2:
            if (to === 6) { //
                newDirection = '^';
                newRow = invert(0);
                newCol = from.coord.col;
            } else if (to === 5) { //
                newDirection = '<';
                newRow = invert(from.coord.row);
                newCol = invert(0);
            } else if (to === 3) { //
                newDirection = '<';
                newRow = from.coord.col;
                newCol = invert(0);
            } else if (to === 1) { //
                newDirection = '<';
                newRow = from.coord.row;
                newCol = invert(0);
            }
            break;
        case 3:
            if (to === 1) { //
                newDirection = '^';
                newRow = invert(0);
                newCol = from.coord.col;
            } else if (to === 2) { //
                newDirection = '^';
                newRow = invert(0);
                newCol = from.coord.row;
            } else if (to === 5) { //
                newDirection = 'v';
                newRow = 0;
                newCol = from.coord.col;
            } else if (to === 4) { //
                newDirection = 'v';
                newRow = 0;
                newCol = from.coord.row;
            }
            break;
        case 4:
            if (to === 3) { //
                newDirection = '>';
                newRow = from.coord.col;
                newCol = 0;
            } else if (to === 5) { //
                newDirection = '>';
                newRow = from.coord.row;
                newCol = 0;
            } else if (to === 6) { //
                newDirection = 'v';
                newRow = 0;
                newCol = from.coord.col;
            } else if (to === 1) { //
                newDirection = '>';
                newRow = invert(from.coord.row);
                newCol = 0;
            }
            break;
        case 5:
            if (to === 3) { //
                newDirection = '^';
                newRow = invert(0);
                newCol = from.coord.col;
            } else if (to === 2) { //
                newDirection = '<';
                newRow = invert(from.coord.row);
                newCol = invert(0);
            } else if (to === 6) { //
                newDirection = '<';
                newRow = from.coord.col;
                newCol = invert(0);
            } else if (to === 4) { //
                newDirection = '<';
                newRow = from.coord.row;
                newCol = invert(0);
            }
            break;
        case 6:
            if (to === 4) { //
                newDirection = '^';
                newRow = invert(0);
                newCol = from.coord.col;
            } else if (to === 5) { //
                newDirection = '^';
                newRow = invert(0);
                newCol = from.coord.row;
            } else if (to === 2) { //
                newDirection = 'v';
                newRow = 0;
                newCol = from.coord.col;
            } else if (to === 1) {
                newDirection = 'v';
                newRow = 0;
                newCol = from.coord.row;
            }
            break;
    }

    if (newRow === undefined || newCol === undefined) {
        throw new Error(`Could not find a new row or col for region from ${from.region} to ${to}`);
    }

    return {
        nextRegionCoord: {
            size: from.size,
            coord: { row: newRow, col: newCol },
            region: to            
        },
        newDirection
    };
}

const definition: CubeDefinition = {
    regionAndDirectionToRegion,
    createRegionCalculator,
    regionToNormalizedCoordinate,
    regionTransformer
};

export default definition;
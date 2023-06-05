import { parse } from './util';
import input from './input';
import cubeDefinition from './inputCube'


export type Coordinate = {
    row: number,
    col: number
};

type Grid = {
    [row: number]: {
        [col: number]: string
    }
};

type Limits = {
    min: number,
    max: number
};

export type Board = {
    grid: Grid,
    rowLimits: { // smallest and largest col in that row
        [row: number]: Limits
    },
    colLimits: { // smallest and largest row in that col
        [col: number]: Limits
    }
};

// R - clockwise
// L - anticlockwise
type Rotation = 'R' | 'L';

type Instruction = {
    move: number,
    turn: Rotation
}

export type World = {
    board: Board,
    instructions: Array<Instruction>
    finalMove: number
}

function visualize(board: Board): string {
    let render = '';

    // NOTE: this assumes that board.grid will return keys in sorted order
    for (const row in board.grid) {
        const maxCol = board.rowLimits[row].max;
        for (let col = 0; col <= maxCol; col += 1) {
            const letter = board.grid[row][col];
            render += letter ? letter : ' ';
        }
        render += '\n';
    }

    return render;
}

export type Direction = '>' | 'v' | '<' | '^';
function getNewDirection(currentDirection: Direction, rotation: Rotation): Direction {
    switch (currentDirection) {
        case '>': return rotation === 'R' ? 'v' : '^'; 
        case 'v': return rotation === 'R' ? '<' : '>'; 
        case '<': return rotation === 'R' ? '^' : 'v'; 
        case '^': return rotation === 'R' ? '>' : '<'; 
    }
}

function writeLetter(grid: Grid, coord: Coordinate, letter: string) {
    const { row, col } = coord;
    grid[row] ??= {};
    grid[row][col] = letter;
    return grid;
}

type Path = {
    grid: Grid,
    final: Coordinate
};

type NextBoardCoordinateAndDirectionFunction = (c: Coordinate, d: Direction, b: Board) => {
    nextBoardCoordinate: Coordinate,
    newDirection: Direction
};;


function simulatePath(world: World, nextCoordFn: NextBoardCoordinateAndDirectionFunction): Path {
    const { board, instructions, finalMove } = world;
    const path: Path = {
        grid: {},
        final: { row: 0, col: 0 }
    };

    // initial location + direction
    const location: Coordinate = {
        row: 0,
        col: board.rowLimits[0].min
    };
    let direction: Direction = '>';
    
    writeLetter(path.grid, location, direction);

    // start simulation
    for (const instruction of instructions) {
        const { move, turn } = instruction;
        console.log(`Move ${move} steps in ${direction} direction`);
        for (let m = 0; m < move; m += 1) {
            const { nextBoardCoordinate: next, newDirection } = nextCoordFn(location, direction, board);
            console.log(`Move to [${next.row}, ${next.col}]`);
            
            // keep moving until we get to a wall
            if (board.grid[next.row][next.col] === '#') {
                console.log(`Blocked at [${next.row}, ${next.col}]`);
                break;
            }

            location.row = next.row;
            location.col = next.col;
            direction = newDirection;
            writeLetter(path.grid, location, direction);
        }

        // get our next direction, replacing the most recent letter with it        
        direction = getNewDirection(direction, turn);
        writeLetter(path.grid, location, direction);        
        console.log(`Turn to ${direction} at [${location.row}, ${location.col}]`);
    }

    // finally, make the last moves
    for (let m = 0; m < finalMove; m += 1) {
        const { nextBoardCoordinate: next, newDirection } = nextCoordFn(location, direction, board);            
        
        // keep moving until we get to a wall
        if (board.grid[next.row][next.col] === '#') {
            break;
        }

        location.row = next.row;
        location.col = next.col;
        direction = newDirection;
        writeLetter(path.grid, location, direction);
    }

    path.final.row = location.row;
    path.final.col = location.col;

    return path;
}

const facingScoreMap: { [f in Direction]: number } = {
    '>': 0,
    'v': 1,
    '<': 2,
    '^': 3
};

function score(path: Path): number {
    const { row, col } = path.final;
    const facing = path.grid[row][col] as Direction;
    const facingScore = facingScoreMap[facing];

    return 1000 * (row + 1) + 4 * (col + 1) + facingScore;
}  

function visualizeWithPath(board: Board, path: Grid): string {
    let render = '';

    // NOTE: this assumes that board.grid will return keys in sorted order
    for (const row in board.grid) {
        const maxCol = board.rowLimits[row].max;
        for (let col = 0; col <= maxCol; col += 1) {
            const letter = board.grid[row][col];
            const pathLetter = path[row]?.[col];
            render += pathLetter ? pathLetter : letter ? letter : ' ';
        }
        render += '\n';
    }

    return render;
}

// BEGIN: Part 2 shenanigans
//
// need 3 functions
// function 1: 
//   Given a region and a direction, tell me which is the next region
// function 2:
//   Given a coordinate in a large grid, tell me which region you're in
// function 3:
//   Given a coordinate in a large grid and a direction, tell me what
//   the next coordinate is, taking into consideration the region of the
//   coordinate and if it "wraps around"

// this describes an interface required for a specific type of way a cube is defined
// in a 2-dimensional layout.
export type CubeDefinition = {
    regionAndDirectionToRegion: { [R in Region]: { [D in Direction]: Region }},
    createRegionCalculator: (board: Board) => (coord: Coordinate) => RegionCoord,
    regionToNormalizedCoordinate: { [region in Region]: Coordinate },
    regionTransformer: (from: RegionCoord, to: Region, direction: Direction) => RegionTransform
}

export type Region = 1 | 2 | 3 | 4 | 5 | 6;

export type RegionCoord = {
    region: Region,
    coord: Coordinate,
    size: number
};

export type RegionTransform = {
    nextRegionCoord: RegionCoord,
    newDirection: Direction
};

const {
    regionAndDirectionToRegion,
    createRegionCalculator,
    regionToNormalizedCoordinate,
    regionTransformer
} = cubeDefinition;

function getNextRegion(region: Region, direction: Direction): Region {
    return regionAndDirectionToRegion[region][direction];
}

function getBoardCoordinate(regionCoord: RegionCoord): Coordinate {
    const { coord, region, size } = regionCoord;
    const { row: rowOffset, col: colOffset } = coord;
    const { row: normalizedRow, col: normalizedCol } = regionToNormalizedCoordinate[region];

    return {
        row: normalizedRow * size + rowOffset,
        col: normalizedCol * size + colOffset
    };
}

function getNextRegionCoordinate(coord: RegionCoord, direction: Direction): RegionTransform {
    const { region, coord: { row, col }, size } = coord;

    const getSimpleResult = (coord: Coordinate): RegionTransform => ({
        nextRegionCoord: { region, coord, size },
        newDirection: direction
    });

    // some shortcuts here
    if (
        direction === '>' && col === size - 1 ||
        direction === '<' && col === 0 ||
        direction === '^' && row === 0 ||
        direction === 'v' && row === size - 1
    ) {
        const nextRegion = getNextRegion(region, direction);
        return regionTransformer(coord, nextRegion, direction);
    }

    switch (direction) {
        case '>': return getSimpleResult({ row, col: col + 1 });
        case 'v': return getSimpleResult({ row: row + 1, col });
        case '<': return getSimpleResult({ row, col: col - 1 });
        case '^': return getSimpleResult({ row: row - 1, col });
    };
}

const getNextCoordinateByRegion: NextBoardCoordinateAndDirectionFunction = (boardCoord: Coordinate, direction: Direction, board: Board) => {
    const getRegionCoord = createRegionCalculator(board);
    const regionCoord = getRegionCoord(boardCoord);
    const { nextRegionCoord, newDirection } = getNextRegionCoordinate(regionCoord, direction);
    const nextBoardCoordinate = getBoardCoordinate(nextRegionCoord);

    if (regionCoord.region !== nextRegionCoord.region) {
        console.log(`* Region changed from ${regionCoord.region} => ${nextRegionCoord.region}`);
        console.log(`* Region Coord moved from [${regionCoord.coord.row}, ${regionCoord.coord.col}] to [${nextRegionCoord.coord.row}, ${nextRegionCoord.coord.col}]`);
    }
    

    return { nextBoardCoordinate, newDirection };
}

export default function() {
    const world = parse(input);

    console.log(visualize(world.board));
    console.log(world.board.rowLimits);
    console.log(world.board.colLimits);
    console.log({ instructions: world.instructions, finalMove: world.finalMove });

    const path = simulatePath(world, getNextCoordinateByRegion);
    console.log(path);
    console.log(visualizeWithPath(world.board, path.grid));

    const password = score(path);

    return password;
}
import input from './sample';

type Coordinate = {
    row: number,
    col: number
}

type Grid = {
    [row: number]: {
        [col: number]: string
    }
}

type World = {
    grid: Grid,
    rowLimits: {
        min: number,
        max: number
    },
    colLimits: {
        min: number,
        max: number
    }
}

function setLetter(world: World, coord: Coordinate, letter: string): World {
    const { row, col } = coord;
    const { grid, rowLimits, colLimits } = world;
    grid[row] ??= {};
    grid[row][col] = letter;

    rowLimits.min = Math.min(rowLimits.min, row);
    rowLimits.max = Math.max(rowLimits.max, row);
    colLimits.min = Math.min(colLimits.min, col);
    colLimits.max = Math.max(colLimits.max, col);

    return world;
}

function parse(input: string): World {
    const world = {
        grid: {},
        rowLimits: {
            min: Number.MAX_SAFE_INTEGER,
            max: Number.MIN_SAFE_INTEGER
        },
        colLimits: {
            min: Number.MAX_SAFE_INTEGER,
            max: Number.MIN_SAFE_INTEGER
        }
    };

    const lines = input.split('\n');

    for (let row = 0; row < lines.length; row += 1) {
        const rowLine = lines[row];
        for (let col = 0; col < rowLine.length; col += 1) {
            const letter = rowLine[col];
            if (letter !== '.') {
                setLetter(world, { row, col }, letter)
            }
        }
    }

    return world;
}

function visualize(world: World): string {
    let result = '';
    const { rowLimits, colLimits, grid } = world;
    for (let row = rowLimits.min; row <= rowLimits.max; row += 1) {
        for (let col = colLimits.min; col <= colLimits.max; col += 1) {
            const letter = grid[row][col];
            result += letter === undefined ? '.' : letter;
        }
        result += '\n';
    }
    return result;
}

export default function() {
    const world = parse(input);
    console.log(visualize(world));
    return 'TBD';
}
import input from './sample';

type Coordinate = {
    row: number,
    col: number
}

type Grid = Array<Array<string>>;

type World = {
    grid: Grid,
}

function setLetter(world: World, coord: Coordinate, letter: string): World {
    const { row, col } = coord;
    const { grid } = world;
    grid[row] ??= [];
    grid[row][col] = letter;

    return world;
}

function getLetter(world: World, coord: Coordinate): string | void {
    return (world.grid[coord.row] ?? {})[coord.col];
}

function parse(input: string): World {
    const world = {
        grid: []
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
    const { grid } = world;
    const rowCount = grid.length;
    const colCount = grid[0].length;
    
    for (let row = 0; row < rowCount; row += 1) {
        for (let col = 0; col < colCount; col += 1) {
            const letter = getLetter(world, { row, col });
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
import input from './input';

type Coordinate = {
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

type Board = {
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

type World = {
    board: Board,
    instructions: Array<Instruction>
    finalMove: number
}

function initLimitsIfNeeded(world: World, coord: Coordinate): void {
    const { rowLimits, colLimits } = world.board;
    const { row, col } = coord;

    if (!rowLimits[row]) {
        rowLimits[row] = {
            min: col,
            max: col
        };
    }    

    if (!colLimits[col]) {
        colLimits[col] = {
            min: row,
            max: row
        };
    }

    rowLimits[row].min = Math.min(rowLimits[row].min, col);
    rowLimits[row].max = Math.max(rowLimits[row].max, col);
    colLimits[col].min = Math.min(colLimits[col].min, row);
    colLimits[col].max = Math.max(colLimits[col].max, row);
}

const INSTRUCTIONS_LINE_REGEX = /([0-9]+[RL])/g;
const INSTRUCTION_INPUT_REGEX = /(?<move>[0-9]+)(?<turn>[RL])/;
function parse(input: string): World {
    const world: World = {
        board: {
            grid: {},
            rowLimits: {},
            colLimits: {}
        },
        instructions: [],
        finalMove: 0
    };

    const [boardInput, instructionsInput] = input.split('\n\n');

    // parse out the board
    const boardPart = boardInput.split('\n');
    const rows = boardPart.length;

    for (let row = 0; row < rows; row += 1) {
        const rowString = boardPart[row];
        const cols = rowString.length;
        const rowData: Array<string> = []; // easier to visualize compared to an object
        world.board.grid[row] = rowData;

        for (let col = 0; col < cols; col += 1) {
            const letter = rowString[col];
            if (letter !== ' ') {
                initLimitsIfNeeded(world, { row, col });                
                world.board.grid[row][col] = letter;
            }
        }
    }


    // parse out the instructions
    const instructionsPart = instructionsInput.match(INSTRUCTIONS_LINE_REGEX);

    if (instructionsPart === null) {
        throw new Error(`No instructions in input? ${instructionsInput}`);
    }

    for (const instructionInput of instructionsPart) {
        const groups = instructionInput.match(INSTRUCTION_INPUT_REGEX)?.groups;
        if (groups === undefined) {
            throw new Error(`Could not parse isntruction input [${instructionInput}]`);            
        } else if (groups.turn !=='R' && groups.turn !== 'L') {
            throw new Error(`Read an unknown turn instruction ${groups.turn}`)
        }

        world.instructions.push({
            move: parseInt(groups.move, 10),
            turn: groups.turn
        });
    }

    // parse out the final move
    const FINAL_MOVE_REGEX = /(?<finalMove>[0-9]+)$/;
    const finalMatch = instructionsInput.match(FINAL_MOVE_REGEX);
    const finalMove = finalMatch?.groups?.finalMove;

    if (!finalMove) {
        throw new Error(`${instructionsInput} has no final move`);
    }

    world.finalMove = parseInt(finalMove, 10);

    return world;
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

type Direction = '>' | 'v' | '<' | '^';
function getNewDirection(currentDirection: Direction, rotation: Rotation): Direction {
    switch (currentDirection) {
        case '>': return rotation === 'R' ? 'v' : '^'; 
        case 'v': return rotation === 'R' ? '<' : '>'; 
        case '<': return rotation === 'R' ? '^' : 'v'; 
        case '^': return rotation === 'R' ? '>' : '<'; 
    }
}

function getNextCoordinate(coord: Coordinate, direction: Direction, board: Board) {
    const { row, col } = coord;
    const { rowLimits, colLimits } = board;

    // a bit more complex, need to be cognizant of limits
    switch (direction) {
        case '>': {
            let newCol = col + 1;
            if (newCol > rowLimits[row].max) {
                newCol = rowLimits[row].min;
            }
            return { row, col: newCol };
        }
        case 'v': {
            let newRow = row + 1;
            if (newRow > colLimits[col].max) {
                newRow = colLimits[col].min;
            }
            return { row: newRow, col };
        }
        case '<': {
            let newCol = col - 1;
            if (newCol < rowLimits[row].min) {
                newCol = rowLimits[row].max;
            }
            return { row, col: newCol };
        }
        case '^': {
            let newRow = row - 1;
            if (newRow < colLimits[col].min) {
                newRow = colLimits[col].max;
            }
            return { row: newRow, col };            
        }
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

function simulatePath(world: World): Path {
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
            const next = getNextCoordinate(location, direction, board);
            console.log(`Move to [${next.row}, ${next.col}]`);
            
            // keep moving until we get to a wall
            if (board.grid[next.row][next.col] === '#') {
                console.log(`Blocked at [${next.row}, ${next.col}]`);
                break;
            }

            location.row = next.row;
            location.col = next.col;
            writeLetter(path.grid, location, direction);
        }

        // get our next direction, replacing the most recent letter with it        
        direction = getNewDirection(direction, turn);
        writeLetter(path.grid, location, direction);        
        console.log(`Turn to ${direction} at [${location.row}, ${location.col}]`);
    }

    // finally, make the last moves
    for (let m = 0; m < finalMove; m += 1) {
        const next = getNextCoordinate(location, direction, board);            
        
        // keep moving until we get to a wall
        if (board.grid[next.row][next.col] === '#') {
            break;
        }

        location.row = next.row;
        location.col = next.col;
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

export default function() {
    const world = parse(input);

    console.log(visualize(world.board));
    console.log(world.board.rowLimits);
    console.log(world.board.colLimits);
    console.log({ instructions: world.instructions, finalMove: world.finalMove });

    const path = simulatePath(world);
    console.log(visualizeWithPath(world.board, path));

    const password = score(path);

    return password;
}
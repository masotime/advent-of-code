import input from './input';

type Coordinate = {
    row: number,
    col: number
}

type Grid = {
    [row: number]: {
        [col: number]: string
    }
}

type Action = 'north' | 'south' | 'west' | 'east';

type World = {
    grid: Grid,
    rowLimits: {
        min: number,
        max: number
    },
    colLimits: {
        min: number,
        max: number
    },
    elves: Array<Coordinate>,
    proposedActionOrder: Array<Action>    
}

function calibrateLimits(world: World) {
    const { grid, rowLimits, colLimits } = world;

    rowLimits.min = colLimits.min = Number.MAX_SAFE_INTEGER;
    rowLimits.max = colLimits.max = Number.MIN_SAFE_INTEGER;

    for (const row in grid) {
        const rowObject = grid[row];
        rowLimits.min = Math.min(rowLimits.min, parseInt(row, 10));
        rowLimits.max = Math.max(rowLimits.max, parseInt(row, 10));
        for (const col in rowObject) {
            colLimits.min = Math.min(colLimits.min, parseInt(col, 10));
            colLimits.max = Math.max(colLimits.max, parseInt(col, 10));
        }
    }
}


function setLetter(world: World, coord: Coordinate, letter: string): World {
    const { row, col } = coord;
    const { grid, rowLimits, colLimits } = world;
    grid[row] ??= {};
    grid[row][col] = letter;

    return world;
}

function getLetter(world: World, coord: Coordinate): string | void {
    return (world.grid[coord.row] ?? {})[coord.col];
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
        },
        elves: [] as Coordinate[],
        proposedActionOrder: ['north', 'south', 'west', 'east'] as Action[]
    };

    const lines = input.split('\n');

    for (let row = 0; row < lines.length; row += 1) {
        const rowLine = lines[row];
        for (let col = 0; col < rowLine.length; col += 1) {
            const letter = rowLine[col];
            if (letter === '#') {
                setLetter(world, { row, col }, letter)
                world.elves.push({row, col});
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
            const letter = getLetter(world, { row, col });
            result += letter === undefined ? '.' : letter;
        }
        result += '\n';
    }
    return result;
}

function getActionDestination(coord: Coordinate, action: Action, world: World): Coordinate {
    const { row, col } = coord;
    let newRow = row, newCol = col;

    switch (action) {
        case 'north': newRow -= 1; break;
        case 'south': newRow += 1; break;
        case 'east': newCol += 1; break;
        case 'west': newCol -= 1; break;
    }

    const destination = { row: newRow, col: newCol };

    if (getLetter(world, destination)) {
        throw new Error(`Illegal attempt to move elf at ${row},${col} to ${newRow}, ${newCol}`);
    }

    return destination;
}

type ActionDestination = {
    action: Action,
    destination: Coordinate
};

function proposeActionDestination(coord: Coordinate, world: World): ActionDestination | void {
    const { proposedActionOrder } = world;
    const isEmpty = ([row, col]: [row: number, col: number]) => getLetter(world, {row, col}) === undefined;
    const allEmpty = (coords: Array<[number, number]>) => coords.every(isEmpty);
    const { row, col } = coord;

    // N: Everything row-1
    // W: Everything col-1
    // E: Everything col+1
    // S: Everything row+1
    const check: { [A in Action]: boolean } = {
        north: allEmpty([[row-1, col-1], [row-1, col], [row-1, col+1]]),
        west: allEmpty([[row-1, col-1], [row, col-1], [row+1, col-1]]),
        east: allEmpty([[row-1, col+1], [row, col+1], [row+1, col+1]]),
        south: allEmpty([[row+1, col-1], [row+1, col], [row+1, col+1]])
    };

    if (check.north && check.west && check.east && check.south) {
        return;
    }

    const action = proposedActionOrder.find((action) => check[action]);
    if (!action) return;
    
    return {
        action,
        destination: getActionDestination(coord, action, world)
    };
}

function simulateRound(world: World): number {
    const { grid, rowLimits, colLimits, elves, proposedActionOrder } = world;
    const proposals: { [destination: string]: Array<[number, ActionDestination]> } = {};
    let movesMade = 0;

    for (let elfIndex = 0; elfIndex < elves.length; elfIndex += 1) {
        const elf = elves[elfIndex];
        const elfProposal = proposeActionDestination(elf, world);
        if (elfProposal) {
            const { action, destination: { row, col } } = elfProposal;
            const destinationKey = `${row},${col}`;
            proposals[destinationKey] ??= [];
            proposals[destinationKey].push([elfIndex, elfProposal]); 
        }
    }

    for (const destinationKey in proposals) {
        const proposalArray = proposals[destinationKey];
        if (proposalArray.length === 1) {
            const [ elfIndex, elfProposal ] = proposalArray[0];
            const elfCoord = elves[elfIndex];

            // delete the elf from its current position, set its new position
            // both on the grid and in the elves array
            delete world.grid[elfCoord.row][elfCoord.col];
            if (Object.keys(world.grid[elfCoord.row]).length === 0) {
                delete world.grid[elfCoord.row];
            }
            setLetter(world, elfProposal.destination, '#');
            elves[elfIndex] = elfProposal.destination;
            movesMade += 1;
        }
    }

    // cycle the proposals
    const action = world.proposedActionOrder.shift()!;
    world.proposedActionOrder.push(action);

    calibrateLimits(world);
    
    return movesMade;
}

export default function() {
    const world = parse(input);

    console.log('== Initial State ==');
    console.log(visualize(world));
    console.log('\n');

    for (let round = 0; round < 10; round += 1) {
        simulateRound(world);
        console.log(`== End of round ${round+1} ==`);
        console.log(visualize(world));
        console.log('\n');
    }

    const rowCount = (world.rowLimits.max - world.rowLimits.min + 1);
    const colCount = (world.colLimits.max - world.colLimits.min + 1);
    const elfCount = world.elves.length;

    const emptySpaces = rowCount * colCount - elfCount;
    
    return { emptySpaces };
}
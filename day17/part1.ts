import input from './input';

type Grid = {
    [row: number]: {
        [col: number]: string | void
    }
};

type Coordinate = {
    row: number,
    col: number
};

type Shape = {
    grid: Grid,
    maxWidth: number,
    maxHeight: number,
};

type Jet = '>' | '<';

type WorldState = {
    jetIndex: number,
    rockIndex: number
};

type Chamber = {
    grid: Grid,
    width: number,
    dropCol: number,
    dropHeight: number,
    floorRow: number,
    emptyRow: number,    
    jetPattern: Array<Jet>,
    rockPattern: Array<Shape>
}

const jetEffect = (jet: Jet, coord: Coordinate): Coordinate => {
    switch (jet) {
        case '>': return { row: coord.row, col: coord.col + 1 };
        case '<': return { row: coord.row, col: coord.col - 1 };
    }
}

const _u_ = undefined;

function hasCollision(shape: Shape, chamber: Chamber, coord: Coordinate) {
    for (let r = 0; r < shape.maxHeight; r += 1) {
        for (let c = 0; c < shape.maxWidth; c += 1) {
            const shapeItem = (shape.grid[r] ?? [])[c]
            if (shapeItem === undefined) {
                continue;
            }

            const gridRow = r + coord.row;
            const gridCol = c + coord.col;

            // check boundaries - if the col goes < 0 or >= chamber.width
            // it's automatically a collision
            if (gridCol < 0 || gridCol >= chamber.width) {
                return true;
            }
            
            const gridIItem = (chamber.grid[gridRow] ?? [])[gridCol];
            if (gridIItem !== undefined) {
                return true;
            }
        }
    }
    return false;
}

function placeRock(shape: Shape, chamber: Chamber, coord: Coordinate) {
    const { grid } = chamber
    for (let r = 0; r < shape.maxHeight; r += 1) {
        for (let c = 0; c < shape.maxWidth; c += 1) {
            const shapeItem = (shape.grid[r] ?? [])[c]
            if (shapeItem === undefined) {
                continue;
            }

            grid[r + coord.row] ??= [];
            grid[r + coord.row][c + coord.col] = shapeItem;
        }
    }

    // adjust the bottomRow as well. Math.min because the rock may have fallen
    // below the current topline
    chamber.emptyRow = Math.min(coord.row - 1, chamber.emptyRow);
}

const horizontal: Shape = {
    grid: {
        0: ['#', '#', '#', '#']
    },
    maxWidth: 4,
    maxHeight: 1
};

const cross: Shape = {
    grid: {
        0: [_u_, '#', _u_],
        1: ['#', '#', '#'],
        2: [_u_, '#', _u_]
    },
    maxWidth: 3,
    maxHeight: 3
};

const hook: Shape = {
    grid: {
        0: [_u_, _u_, '#'],
        1: [_u_, _u_, '#'],
        2: ['#', '#', '#']
    },
    maxWidth: 3,
    maxHeight: 3
};

const vertical: Shape = {
    grid: {
        0: ['#'],
        1: ['#'],
        2: ['#'],
        3: ['#']
    },
    maxWidth: 1,
    maxHeight: 4
};

const square: Shape = {
    grid: {
        0: ['#', '#'],
        1: ['#', '#'],
    },
    maxWidth: 2,
    maxHeight: 2
};

type FallingRock = {
    shape: Shape,
    position: Coordinate
};

function visualizeChamber(chamber: Chamber, fallingRock?: FallingRock): string {
    let result = '';
    const { emptyRow, floorRow, grid } = chamber;
    const shapeOffset = (fallingRock?.shape.maxHeight) ?? 0;
    const rowOffset = 3 + shapeOffset;

    for (let row = emptyRow - rowOffset; row <= floorRow; row += 1) {
        result += row === floorRow ? '\\': '|';
        for (let col = 0; col < chamber.width; col += 1) {
            let gridItem = (grid[row] ?? [])[col];
            let fallingRockItem: string | void = undefined;

            if (fallingRock) {
                const { shape, position } = fallingRock;
                gridItem = (shape.grid[row - position.row] ?? [])[col - position.col] ? '@' : gridItem;
            }


            result += gridItem === undefined ? '.' : gridItem;
        }

        result += row === floorRow ? '/': '|';
        result += '\n';
    }
    
    return result;
}

function simulateFall(chamber: Chamber, worldState: WorldState, shape: Shape): Chamber {
    const { emptyRow, dropCol, dropHeight, grid } = chamber
    
    // calculate where the shape starts falling from
    const rockPosition: Coordinate = {
        row: emptyRow - dropHeight - shape.maxHeight,
        col: dropCol
    };

    // sanity check
    if (hasCollision(shape, chamber, rockPosition)) {
        throw new Error(`Detected collision???`);
    }

    // keeping falling and jetting.
    // * Stop if a fall will hit an object
    // * Ignore if a jet will hit an object
    let falling = true;
    let initialFallShown = false;
    while (falling) {
        const jet = chamber.jetPattern[worldState.jetIndex];

        // 1. Drop first. Check if we can drop down
        const droppedPosition = {
            row: rockPosition.row + 1,
            col: rockPosition.col
        };

        const droppedPositionCausesCollision = hasCollision(shape, chamber, droppedPosition);

        if (droppedPositionCausesCollision) {
            falling = false;
            break;
        } else {
            
            rockPosition.row = droppedPosition.row;
            rockPosition.col = droppedPosition.col;

            if (!initialFallShown) {
                console.log('Initial Fall')
                console.log(visualizeChamber(chamber, { shape, position: rockPosition }));
                initialFallShown = true;    
            }
        }

        // always advance jet variable after pulling it out
        worldState.jetIndex = (worldState.jetIndex + 1) % chamber.jetPattern.length;

        // apply jet if there's no collision after doing so
        const jettedPosition = jetEffect(jet, rockPosition);
        const jetCausesCollision = hasCollision(shape, chamber, jettedPosition);

        if (!jetCausesCollision) {
            rockPosition.row = jettedPosition.row;
            rockPosition.col = jettedPosition.col;            
        }
    }

    // falling is complete. We need to place the rock into the chamber
    placeRock(shape, chamber, rockPosition);
    console.log('Fall complete');
    console.log(visualizeChamber(chamber));
    console.log('Height', chamber.floorRow - chamber.emptyRow - 1);

    // while this has been happening, the world state
    // has also been updated (jetIndex)
    return chamber;
}

export default function() {
    const jetPattern: Array<Jet> = input.split('') as Array<Jet>;
    const rockPattern: Array<Shape> = [horizontal, cross, hook, vertical, square];

    // initialize the chamber
    const chamber: Chamber = {
        grid: {},
        width: 7,
        dropCol: 2,
        dropHeight: 3,
        floorRow: 100000,
        emptyRow: 99999,
        jetPattern,
        rockPattern
    };

    const worldState: WorldState = {
        jetIndex: 0,
        rockIndex: 0
    };
    
    chamber.grid[chamber.floorRow] = Array(chamber.width).fill('-');

    const rockSimulationFalls = 2022;
    
    for (let i = 0; i < rockSimulationFalls; i += 1) {        
        const shape = chamber.rockPattern[worldState.rockIndex];
        worldState.rockIndex = (worldState.rockIndex + 1) % chamber.rockPattern.length;

        simulateFall(chamber, worldState, shape);
    }

    return { height: chamber.floorRow - chamber.emptyRow - 1 };
}
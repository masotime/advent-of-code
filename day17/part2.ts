import input from './input';

type Grid = {
    [row: number]: Array<string | void>
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
    rockIndex: number,
    rocksFallen: number
};

type RowActivation = {
    [row: number]: number
};

type Chamber = {
    grid: Grid,
    width: number,
    dropCol: number,
    dropHeight: number,
    floorRow: number,
    emptyRow: number,    
    jetPattern: Array<Jet>,
    rockPattern: Array<Shape>,
    activations: RowActivation
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

function placeRock(shape: Shape, chamber: Chamber, coord: Coordinate, activation: number) {
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

        // for each row, if an activation has not yet been assigned for it,
        // do so.
        if (chamber.activations[r + coord.row] === undefined) {
            chamber.activations[r + coord.row] = activation
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
    worldState.rocksFallen += 1;
    placeRock(shape, chamber, rockPosition, worldState.rocksFallen);

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
        rockPattern,
        activations: {}
    };

    const worldState: WorldState = {
        jetIndex: 0,
        rockIndex: 0,
        rocksFallen: 0
    };
    
    chamber.grid[chamber.floorRow] = Array(chamber.width).fill('-');

    // As per part 1, do simulations, but the objective here is to find a pattern.
    // 100000 is arbitrary and happened to be enough for me to find a pattern.
    const rockSimulationFalls = 100000;
    
    for (let i = 0; i < rockSimulationFalls; i += 1) {        
        const shape = chamber.rockPattern[worldState.rockIndex];
        worldState.rockIndex = (worldState.rockIndex + 1) % chamber.rockPattern.length;

        simulateFall(chamber, worldState, shape);
    }

    function render(row: Array<string | void>): string {
        let output = '';
        for (let i = 0; i < 7; i += 1) {
            output += row[i] || '.';
        }

        return output;
    }

    // we now have a huge chamber, but we need to find repeating patterns
    let patternHeight = 10;

    // these are arbitrary numbers. There's probably a way to determine it based on
    // shape count and length of jet pattern, but I'm too lazy to do the math (I mean this
    // is a programming adventure, not a math one....)
    let MAX_PATTERN_HEIGHT = 10000;
    let MAX_START_VARIATION = 10000;
    let solution = undefined;
    
    for (let startRow = chamber.floorRow - 1; startRow > chamber.floorRow - 1 - MAX_START_VARIATION; startRow -= 1) {
        startRow % 100 === 0 && console.log('considering starting at row', startRow);
        patternHeight = 10;
        
        while (patternHeight < MAX_PATTERN_HEIGHT) {
            let patternFound = true;
            
            for (let r = startRow; r > startRow - patternHeight; r -= 1) {
                // check to see if rows from start                     to start - patternHeight + 1
                //       match the rows from start - patternHeight     to start - patternHeight * 2 + 1
                //       and   the rows from start - patternHeight * 2 to start - patternHeight * 3 + 1
                // here I check to see if the pattern repeats at least 6 times.
                // again this is arbitrary, I don't really know what's a good number of itmes.
                const row1 = render(chamber.grid[r] ?? []);
                const row2 = render(chamber.grid[r - patternHeight] ?? []);
                const row3 = render(chamber.grid[r - patternHeight * 2] ?? []);
                const row4 = render(chamber.grid[r - patternHeight * 3] ?? []);
                const row5 = render(chamber.grid[r - patternHeight * 4] ?? []);
                const row6 = render(chamber.grid[r - patternHeight * 5] ?? []);
                if (row1 !== row2 || row1 !== row3 || row1 !== row4 || row1 !== row5 || row1 !== row6) {
                    patternFound = false;
                    break;
                }
            }
    
            if (patternFound) {
                solution = { patternHeight, startRow };
                break;
            }
    
            patternHeight += 1;
        }

        if (solution) {
            break;
        }
    }


    if (solution) {
        console.log('found a recurring pattern in the rock formation with the characteristics', solution);
        const dropWhenPatternStarts = chamber.activations[solution.startRow];
        const dropsInPattern = chamber.activations[solution.startRow - solution.patternHeight] - dropWhenPatternStarts;
        console.log(`Presumably, after the ${dropWhenPatternStarts}th drop, and every ${dropsInPattern} drops thereafter, the height increases by ${patternHeight}`);

        // try to derive a map for the height of the pattern after the dropWhenPatternStarts'th drop.
        const dropsToHeight: { [drop: number]: number } = {};
        const baseHeight = chamber.floorRow - solution.startRow;
        console.log({ baseHeight });

        for (let row = solution.startRow; row >= solution.startRow - solution.patternHeight; row -= 1) {
            const height = solution.startRow - row;
            dropsToHeight[chamber.activations[row] - dropWhenPatternStarts] = height;
        }

        // we need to populate the drops in between. Sometimes a drop will not activate
        // a new row, so the drop uses the previous height of a lower drop (i.e. the drop didn't increase
        // the height)
        let lastDropHeight = 0;
        for (let drop = 0; drop < dropsInPattern; drop += 1) {
            if (dropsToHeight[drop] !== undefined) {
                lastDropHeight = dropsToHeight[drop];
            } else {
                dropsToHeight[drop] = lastDropHeight;
            }
        }

        // so the formula is
        const formula = (drops: number) => {
            // the complicated part is that we must track the height and the drops separately
            if (drops < dropWhenPatternStarts) {
                throw new Error(`Can't use formula for less than ${dropWhenPatternStarts} drops`);
            }

            const dropsAfterBase = drops - dropWhenPatternStarts;
            const timesPatternIsRepeated = Math.floor(dropsAfterBase / dropsInPattern);
            const dropsAfterTheLastPattern = dropsAfterBase - timesPatternIsRepeated * dropsInPattern;

            return baseHeight + timesPatternIsRepeated * patternHeight + dropsToHeight[dropsAfterTheLastPattern];
        }

        console.log('The mapping of drops to height added (within the pattern) is', dropsToHeight);
        console.log('so for e.g. 1000000000000 drops, the height should be', formula(1000000000000));
        return { height: formula(1000000000000) };
    } else {
        console.log('failed to find a pattern less than', MAX_PATTERN_HEIGHT);
    }

    
}
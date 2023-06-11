import input from './input';

type Coordinate = {
    row: number,
    col: number
}

type Grid = Array<Array<string>>;

type Direction = '^' | '>' | 'v' |'<';

type Blizzard = {
    position: Coordinate,
    direction: Direction
}

type World = {
    grid: Grid,
    blizzards: Array<Blizzard>,
    entrance: Coordinate,
    exit: Coordinate,
}

const MAX_SIMULATIONS = 1000;

const isDirection = (char: string): Direction | false => char === '^' || char === '>' || char === 'v' || char === '<' ? char : false;
const isBlizzard = (letter: string | void): boolean => {
    if (!letter) {
        return false;
    }
    
    return Boolean(isDirection(letter)) || letter.length > 1;
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
    const world: World = {
        grid: [],
        blizzards: [],
        entrance: { row: -1, col: -1 }, // just some initial values
        exit: { row: -1, col: -1 }
    };

    const lines = input.split('\n');

    for (let row = 0; row < lines.length; row += 1) {
        const rowLine = lines[row];
        for (let col = 0; col < rowLine.length; col += 1) {
            const letter = rowLine[col];
            const direction = isDirection(letter);
            // "Your expedition begins in the only non-wall position in the top row"
            if (row === 0 && letter === '.') {
                world.entrance = { row, col };
            } else if (row === lines.length - 1 && letter === '.') {
                world.exit = { row, col };
            }

            if (direction) {
                world.blizzards.push({
                    position: { row, col },
                    direction
                })
            }

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
            const renderedLetter = letter === undefined ? '.' : letter.length > 1 ? letter.length : letter;
            result += renderedLetter;
        }
        result += '\n';
    }
    return result;
}

function simulateBlizzard(blizzard: Blizzard, world: World): Coordinate {
    const { grid } = world;
    const rowCount = grid.length;
    const colCount = grid[0].length;
    const { position, direction } = blizzard;
    let newPosition = { ...position };

    switch (direction) {
        case '^': {
            newPosition.row -= 1;
            if (grid[newPosition.row][newPosition.col] === '#') {
                // -1 because zero-indexed, -1 because wall
                newPosition.row = rowCount - 2;
            }
            break;
        }
        case '>': {
            newPosition.col += 1;
            if (grid[newPosition.row][newPosition.col] === '#') {
                // 0 is the wall
                newPosition.col = 1;
            }
            break;
        }
        case 'v': {
            newPosition.row += 1;
            if (grid[newPosition.row][newPosition.col] === '#') {
                // 0 is the wall
                newPosition.row = 1;
            }
            break;
        }
        case '<': {
            newPosition.col -= 1;
            if (grid[newPosition.row][newPosition.col] === '#') {
                // -1 because zero-indexed, -1 because wall
                newPosition.col = colCount - 2; 
            }
            break;
        }
    }

    // sanity check
    const letter = getLetter(world, newPosition);
    if (letter === '#') {
        throw new Error(`invalid position ${newPosition.row}, ${newPosition.col} has letter [${letter}]`);
    }

    return newPosition;
}

// the blizzards move in a predictable way, so it can be useful to just
// generate all the blizzard states over time as a quick reference
// when considering what moves can be made by the expedition at any given
// point in time. Note: Each World should be unique - i.e. careful of not
// sharing references to the same object across worlds (except stuff like
// the entrance and exit coordinates)
function simulateNextMinute(world: World): World {
    const nextWorld: World = {
        grid: [], // to be repopulated
        blizzards: [] as Array<Blizzard>, // to be repopulated
        entrance: world.entrance,
        exit: world.exit
    }

    // regenerate the grid without blizzards
    for (let row = 0; row < world.grid.length; row += 1) {
        nextWorld.grid[row] = [];
        for (let col = 0; col < world.grid[0].length; col += 1) {
            const letter = world.grid[row][col];
            const hasBlizzard = isBlizzard(letter);
            if (!hasBlizzard) {
                nextWorld.grid[row][col] = letter;
            }
        }
    }

    // "advance" each blizzard from the current world
    // then place it on the grid (as well as the next world's blizzards)
    for (const blizzard of world.blizzards) {
        const { direction } = blizzard;
        const newPosition = simulateBlizzard(blizzard, world);
        const letter = getLetter(nextWorld, newPosition);

        // could have multiple blizzards
        const nextLetter = letter === undefined ? direction : (letter + direction);
        setLetter(nextWorld, newPosition, nextLetter);
        nextWorld.blizzards.push({
            direction,
            position: newPosition
        });
    }

    return nextWorld;
}

type Move = Direction | 'w'; // 'w' for wait

type Path = {
    moves: Array<Move>,
    currentPosition: Coordinate
};

type ValidMove = {
    move: Move,
    newPosition: Coordinate
};

function generatePossibilities(position: Coordinate, world: World): Array<ValidMove> {
    const { row, col } = position;
    const candidates: Array<ValidMove> = [];

    // do the usual checks
    // now I have to check down as well....
    const down = { row: row + 1, col };
    const downLetter = getLetter(world, down);
    const downWithinGrid = down.row >= 0 && down.row < world.grid.length;
    if (downWithinGrid && downLetter !== '#' && !isBlizzard(downLetter)) {
        candidates.push({
            move: 'v',
            newPosition: down
        });
    }

    const right = { row, col: col + 1 };
    const rightLetter = getLetter(world, right);    
    if (rightLetter !== '#' && !isBlizzard(rightLetter)) {
        candidates.push({
            move: '>',
            newPosition: right
        });
    }

    const left = { row, col: col - 1 };
    const leftLetter = getLetter(world, left);    
    if (leftLetter !== '#' && !isBlizzard(leftLetter)) {
        candidates.push({
            move: '<',
            newPosition: left
        });
    }

    // the row >= 0 is just because you can start at the entrance
    // with no walls above you 🙄.
    const up = { row: row - 1, col };
    const upLetter = getLetter(world, up);    
    const upWithinGrid = up.row >= 0 && up.row < world.grid.length;
    if (upWithinGrid && upLetter !== '#' && !isBlizzard(upLetter)) {
        candidates.push({
            move: '^',
            newPosition: up
        });
    }

    const currentLetter = getLetter(world, position);
    const blizzardAtPosition = isBlizzard(currentLetter);
    
    if (!blizzardAtPosition) {
        candidates.push({
            move: 'w',
            newPosition: { ...position }
        });
    }    

    return candidates;
}

function visualizeWorld(world: World, position: Coordinate): string {
    let render = '';
    for (let row = 0; row < world.grid.length; row += 1) {
        for (let col = 0; col < world.grid[0].length; col += 1) {
            const currentLetter = getLetter(world, { row, col });                
            if (position.row === row && position.col === col) {
                render += '\x1b[1;37;44mE\x1b[0m';
            } else if (currentLetter) {
                render += currentLetter.length > 1 ? currentLetter.length : currentLetter;
            } else {
                render += '.';
            }
        }
        render += '\n';
    }

    return render;
}

function visualizeCandidate(worldStates: { [time: number]: World }, path: Path, expeditionState: ExpeditionState): string {
    const renders: Array<string> = [];    
    let position: Coordinate = { ...expeditionState.start };
    renders.push(`Candidate of length ${path.moves.length}, ${path.moves.join('')}`);
    for (let t = 0; t <= path.moves.length; t += 1) {
        const world = worldStates[t];
        const render = visualizeWorld(world, position);
        
        // need to move the position based on the path
        switch (path.moves[t]) {
            case 'w': break;
            case '^': position.row -= 1; break;
            case '>': position.col += 1; break;
            case 'v': position.row += 1; break;
            case '<': position.col -= 1; break;
        }

        renders.push(`At time ${t}:\n${render}\n`);
    }

    return renders.join('\n');
}

function sortAndPrune(candidates: Array<Path>): Array<Path> {

    // dedupe - if you have the same position and time, just remove the path
    candidates.sort((path1, path2) => {
        if (path1.moves.length === path2.moves.length) {
            const { row: row1, col: col1 } = path1.currentPosition;
            const { row: row2, col: col2 } = path2.currentPosition;

            if (row1 > row2) {
                return 1;
            } else if (row1 < row2) {
                return -1;
            } else if (col1 > col2) {
                return 1;
            } else if (col1 < col2) {
                return -1;
            }
            return 0;
        } else {
            return path1.moves.length - path2.moves.length;
        }
    });

    for (let i = candidates.length - 2; i >= 0; i -= 1) {
        const curr = candidates[i];
        const next = candidates[i+1];

        if (
            curr.currentPosition.row === next.currentPosition.row &&
            curr.currentPosition.col === next.currentPosition.col) {
            candidates.splice(i+1,1);
        }
    }

    return candidates;
}

type ExpeditionState = {
    start: Coordinate,
    target: Coordinate,
}

function distanceFromExit(current: Coordinate, exit: Coordinate): number {
    // use manhattan distance
    return Math.abs(current.row - exit.row) + Math.abs(current.col - exit.col);
}

function solve(worldStates: { [time: number]: World}, expeditionState: ExpeditionState): Path {
    const exit = expeditionState.target;
    const initialPath = {
        moves: [],
        currentPosition: { ...expeditionState.start } 
    } 
    const candidates: Array<Path> = [initialPath]

    while (candidates.length > 0) {
        
        // can't be undefined due to while condition
        const candidate = candidates.shift()!;
        const { moves, currentPosition } = candidate;
        const time = moves.length;

        if (time > MAX_SIMULATIONS) {
            throw new Error(`Could not find solution before time ${MAX_SIMULATIONS}`);
        }

        const nextWorld = worldStates[time + 1];
        const possibilities = generatePossibilities(currentPosition, nextWorld);

        for (const possibility of possibilities) {
            const { move, newPosition } = possibility;
            const newCandidate = {
                moves: [...moves, move],
                currentPosition: newPosition
            };

            // end condition - solution found
            if (newPosition.row === exit.row && newPosition.col === exit.col) {
                // console.log(`Found a solution of length ${newCandidate.moves.length}`);
                return newCandidate;
            }

            candidates.push(newCandidate);
        }

        sortAndPrune(candidates);
        // console.log('======================= CYCLE DIVIDER ================');
        // candidates.forEach((candidate, idx) => {
        //     console.log('   CANDIDATE', idx, {
        //         time: candidate.moves.length,
        //         score: distanceFromExit(candidate.currentPosition, exit)
        //     });
        //     // console.log(visualizeCandidate(worldStates, candidate));
        // })
        
        // if (candidates.length % 100 === 0 && candidates.length > 0) {
        //     console.log(`Candidate space is ${candidates.length}, time ${time}`);            
        //     console.log('   CANDIDATE', 0, {
        //         time: candidates[0].moves.length,
        //         score: distanceFromExit(candidates[0].currentPosition, exit)
        //     });
        //     console.log('   CANDIDATE', candidates.length - 1, {
        //         time: candidates[candidates.length - 1].moves.length,
        //         score: distanceFromExit(candidates[candidates.length - 1].currentPosition, exit)
        //     });
        // }
    }

    throw new Error('Ran out of candidates and could not find a path!');
}

export default function() {
    const world = parse(input);
    console.log('=== Initial World ===');
    console.log(visualize(world));
    console.log('\n');

    const worldSimulations = [world];

    console.log('Generating simulations');
    const start = Date.now();
    const simulationsGenerated = MAX_SIMULATIONS;
    // simulate the crap out of the world
    for (let t = 1; t <= simulationsGenerated; t += 1) {
        const lastWorld = worldSimulations[t-1];
        const nextWorld = simulateNextMinute(lastWorld);
        worldSimulations.push(nextWorld);
    }
    const secondsTaken = (Date.now() - start) / 1000;
    console.log(simulationsGenerated, 'simulations took', secondsTaken.toPrecision(2), 'seconds');

    const movesTaken = {
        there: 0,
        back: 0,
        thereAgain: 0
    };

    // first we do the usual process
    console.log('======= THERE =========');
    const there: ExpeditionState = {
        start: { ...world.entrance },
        target: { ...world.exit },
    };
    const thereSolutionPath = solve(worldSimulations, there);
    movesTaken.there = thereSolutionPath.moves.length;    
    console.log(visualizeCandidate(worldSimulations, thereSolutionPath, there));

    // then we slice the worldSimulations accordingly to match the new starting state
    console.log('======= BACK =========');
    const backWorldSimulations = worldSimulations.slice(movesTaken.there);

    const back: ExpeditionState = {
        start: { ...world.exit},
        target: { ...world.entrance },
    };
    const backSolutionPath = solve(backWorldSimulations, back);
    movesTaken.back = backSolutionPath.moves.length;    
    console.log(visualizeCandidate(backWorldSimulations, backSolutionPath, back));

    // we slice the worldSimulations again
    console.log('======= THERE AGAIN =========');
    const thereAgainWorldSimulations = worldSimulations.slice(movesTaken.there + movesTaken.back);

    // NOTE: use the same expedition state as at the beginning
    const thereAgainSolutionPath = solve(thereAgainWorldSimulations, there);
    movesTaken.thereAgain = thereAgainSolutionPath.moves.length;
    console.log(visualizeCandidate(thereAgainWorldSimulations, thereAgainSolutionPath, there));

    console.log({ movesTaken });

    return movesTaken.there + movesTaken.back + movesTaken.thereAgain;
}
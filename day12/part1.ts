import input from './input';

type Coordinate = {
    row: number,
    col: number
};

type Step = {
    location: Coordinate,
    direction: Direction | void
};

type Direction = 'v' | '>' | '^' | '<';

type Path = Array<Step>;

type Grid<T> = Array<Array<T>>;

type Maze = {
    start: Coordinate,
    end: Coordinate,
    grid: Grid<number>
};

const BASE_HEIGHT = 'a'.charCodeAt(0);

// can be faster if we made this a lookup table
function translate(s: string): number {
    return s.charCodeAt(0) - BASE_HEIGHT;
}

function parseInput(input: string): Maze {
    const start = { row: 0, col: 0 };
    const end = { row: 0, col: 0};
    const grid: Array<Array<number>> = [];

    const rows = input.split('\n');
    for (let r = 0; r < rows.length; r += 1) {
        const row = rows[r];
        const letters = row.split('');
        
        // check for S and E first, and set start/end then convert them to a/z.
        const startIdx = letters.indexOf('S');
        const endIdx = letters.indexOf('E');
        if (startIdx !== -1) {
            letters[startIdx] = 'a';
            start.row = r;
            start.col = startIdx;
        }

        if (endIdx !== -1) {
            letters[endIdx] = 'z';
            end.row = r;
            end.col = endIdx;
        }

        // now we translate the stuff and push it into the grid
        const heights = letters.map(_ => translate(_));
        
        grid.push(heights);
    }


    return {
        start,
        end,
        grid
    };
}

function coordForDirection(direction: Direction, coord: Coordinate): Coordinate {
    const { row, col } = coord;
    switch (direction) {
        case '^':
            return { row: row - 1, col };
        case '<':
            return { row, col: col - 1 };
        case 'v':
            return { row: row + 1, col };
        case '>':
            return { row, col: col + 1 };
    }
}

function isValidCoord(coord: Coordinate, maze: Maze): boolean {
    return maze.grid[coord.row]?.[coord.col] !== undefined;
}

function isValidStep(prev: Coordinate, next: Coordinate, maze: Maze) {
    const prevHeight = maze.grid[prev.row][prev.col];
    const nextHeight = maze.grid[next.row][next.col];

    return nextHeight - prevHeight <= 1; // i.e. can't climb up more than 1 step up
}

function isExplored(coord: Coordinate, explored: Grid<boolean>) {
    return explored[coord.row]?.[coord.col] === true;
}

function renderGrid(maze: Maze): string {
    let output = '';
    const { grid, start, end } = maze;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            if (start.row === row && start.col === col) {
                output += 'S'
            } else if (end.row === row && end.col === col) {
                output += 'E'
            } else {
                output += String.fromCharCode(BASE_HEIGHT + grid[row][col]);
            }
        }
        output += '\n';
    }

    return output;
}

function renderPath(path: Path, maze: Maze): string {
    let output: Grid<string> = [];
    const { grid, start, end } = maze;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let row = 0; row < rows; row += 1) {
        const outputRow: Array<string> = [];
        output.push(outputRow);
        for (let col = 0; col < cols; col += 1) {
            if (start.row === row && start.col === col) {
                outputRow.push('S');
            } else if (end.row === row && end.col === col) {
                outputRow.push('E')
            } else {
                outputRow.push('.');
            }
        }
    }

    for (const step of path) {
        const { location, direction } = step;
        const { row, col } = location;

        if (direction) {
            output[row][col] = direction;
        }
    }

    const partialOutput = output.map(row => row.join(''));
    return partialOutput.join('\n');
}

function solve(maze: Maze): Path {
    // BFS, maintain a stack of "fronts" and iterate through them (no recursion)
    const initialPath: Path = [{
        location: { ...maze.start },
        direction: undefined
    }];
    const paths: Array<Path> = [initialPath];
    const explored: Grid<boolean> = [];
    const directions: Array<Direction> = ['v', '>', '^', '<'];

    // set the start position as explored
    explored[maze.start.row] = [];
    explored[maze.start.row][maze.start.col] = true;

    // iterate through each "front" of every path
    while (paths.length > 0) {
        const path = paths.shift(); // must be shift, not pop. we want to evaluate shortest paths first
        if (!path) throw new Error('should never happen, no path?');
        const front = path[path.length - 1];

        // for every front, generate all possible new fronts, then delete that front
        // also track all explored areas so we don't try to go to that area again
        for (const direction of directions) {
            const frontCoord = front.location;
            const newCoord = coordForDirection(direction, frontCoord);
            if (!isValidCoord(newCoord, maze)) {
                // console.log(`${JSON.stringify(newCoord)} is not valid`);
                continue;
            }
            if (!isValidStep(frontCoord, newCoord, maze)) {
                // console.log(`I can't move from ${JSON.stringify(frontCoord)} to ${JSON.stringify(newCoord)}.`);
                continue;
            }
            if (isExplored(newCoord, explored)) {
                // console.log(`${JSON.stringify(newCoord)} has already been visited`);
                continue;
            }

            // valid new front found, append it to the set of paths
            // and mark the new coordinate explored
            const newPath: Path = [...JSON.parse(JSON.stringify(path)), {
                location: newCoord,
                direction: undefined
            }];

            // note that we set the direction on the front            
            newPath[newPath.length - 2].direction = direction;

            // but before we continue, are we at the end? If so, "newPath" is our solution
            if (newCoord.row === maze.end.row && newCoord.col === maze.end.col) {
                return newPath;
            }

            paths.push(newPath);
            explored[newCoord.row] = explored[newCoord.row] || []
            explored[newCoord.row][newCoord.col] = true;
        }
    }

    throw new Error('could not find a path');
}

export default function() {
    const maze = parseInput(input);
    console.log(renderGrid(maze));
    const solution = solve(maze);
    console.log(renderPath(solution, maze));
    return { maze, solutionLength: solution.length - 1 };
}
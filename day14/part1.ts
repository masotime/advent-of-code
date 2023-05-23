import input from './input';

type Grid = {
    [row: number]: {
        [col: number]: string
    }
};

type Coordinate = {
    row: number,
    col: number
};

type Cave = {
    grid: Grid,
    row: {
        min: number,
        max: number
    },
    col: {
        min: number,
        max: number
    },
    sandEscaped: boolean,
    sandCount: number
};

function parseInput(input: string): Cave {
    const cave: Cave = {
        grid: {},
        row: {
            min: 0,
            max: 0
        },
        col: {
            min: 500,
            max: 500
        },
        sandEscaped: false,
        sandCount: 0
    };

    const rockLines = input.split('\n');
    for (const rockLine of rockLines) {
        // note the input coords are in the string format (col, row)
        // so we have to swap them around
        const coords: Array<Coordinate> = rockLine.split(' -> ').map(strCoord => {
            const [colStr, rowStr] = strCoord.split(',');
            return { row: parseInt(rowStr, 10), col: parseInt(colStr, 10) };
        });

        // now for each pairing of coords, we update the min/max boundaries of the Cave
        for (const { row, col } of coords) {
            cave.row.min = Math.min(cave.row.min, row);
            cave.row.max = Math.max(cave.row.max, row);
            cave.col.min = Math.min(cave.col.min, col);
            cave.col.max = Math.max(cave.col.max, col);
        }

        // Draw lines representing them in the grid.
        // Skip the last one since it's only meaningful in pairs
        for (let i=0; i < coords.length - 1; i += 1) {
            const start = coords[i];
            const end = coords[i+1];
            
            const rowS = Math.min(start.row, end.row);
            const rowE = Math.max(start.row, end.row);
            const colS = Math.min(start.col, end.col);
            const colE = Math.max(start.col, end.col); 
            for (let r = rowS; r <= rowE; r += 1) {
                for (let c = colS; c <= colE; c += 1) {
                    cave.grid[r] = cave.grid[r] || [];
                    cave.grid[r][c] = '#';
                }
            }
        }
    }

    return cave;
}

type Direction = 'down' | 'downleft' | 'downright';
const directions: Array<Direction> = ['down', 'downleft', 'downright'];

function dropSand(cave: Cave): Cave {
    // source is always at (0, 500)
    const sand: Coordinate = { row: 0, col: 500 };
    let falling = true;

    function canMove(dir: Direction, sand: Coordinate): { result: boolean, location: Coordinate } {
        const location = { ...sand };
        switch (dir) {
            case 'down':
                location.row += 1; break;            
            case 'downleft':
                location.row += 1; location.col -=1; break;
            case 'downright':
                location.row += 1; location.col += 1; break;            
        }
        return {
            result: cave.grid[location.row]?.[location.col] === undefined,
            location
        }
    }

    function outOfBoundaries(sand: Coordinate) {
        const outsideVertically = sand.row < cave.row.min || sand.row > cave.row.max;
        const outsideHorizontally = sand.col < cave.col.min || sand.col > cave.col.max;
        return (outsideVertically || outsideHorizontally);
    }

    // TBD: Deal if it falls out of the maze
    while (falling) {     
        falling = false; // assume it can't continue to fall first

        for (const direction of directions) {
            const { result, location } = canMove(direction, sand);
            if (result) {
                sand.row = location.row;
                sand.col = location.col;
                falling = true; // can fall, so break and continue outer while loop
                break;
            }
        }

        if (falling && outOfBoundaries(sand)) {
            cave.sandEscaped = true;
            return cave;
        }
    }
    
    // finished falling, mark the position of the sand
    cave.grid[sand.row] = cave.grid[sand.row] || [];
    cave.grid[sand.row][sand.col] = 'o';
    cave.sandCount += 1;
    return cave;
}

function renderCave(cave: Cave): string {
    let caveRender = '';
    for (let row = cave.row.min; row <= cave.row.max; row += 1) {
        for (let col = cave.col.min; col <= cave.col.max; col += 1) {
            const object = (cave.grid[row] ?? [])[col];
            caveRender += object || '.';            
        }
        caveRender += '\n';
    }

    return caveRender;
};

export default function() {
    const cave = parseInput(input);
    let render = '';

    while (!cave.sandEscaped) {
        dropSand(cave);
        render = renderCave(cave);
        // console.log(render);
    }    

    return cave.sandCount;
}
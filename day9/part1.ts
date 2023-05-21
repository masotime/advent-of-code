import input from './input';

type TrailMap = {
    trail: {
        [row: number]: {
            [col: number]: boolean
        }    
    },
    row: {
        max: number,
        min: number
    },
    col: {
        max: number,
        min: number
    }
}

type Direction = 'U' | 'D' | 'L' | 'R';
type Directions = Array<Direction>;
type Coordinate = {
    row: number,
    col: number
};
type HeadTail = {
    H: Coordinate,
    T: Coordinate
};

function isSameRowCol({H, T}: HeadTail): boolean {
    return H.row === T.row || H.col === T.col;
}

function isTouching({H, T}: HeadTail): boolean {
    // const sameSquare = (H.row === T.row) && (H.col === T.col);
    const moreThanOneColumnApart = Math.abs(H.col - T.col) > 1;
    const moreThanOneRowApart = Math.abs(H.row - T.row) > 1;
    // console.log({H, T, sameSquare, moreThanOneColumnApart, moreThanOneRowApart })
    return !(moreThanOneColumnApart || moreThanOneRowApart);
}

function getNewTail(headTail: HeadTail): Coordinate {
    const {H, T} = headTail;
    let newTail: Coordinate = { row: T.row, col: T.col };
    
    // base case
    if (isTouching(headTail)) {
        return newTail;
    }

    const colInc = H.col > T.col ? 1 : -1;
    const rowInc = H.row > T.row ? 1 : -1;
    
    if (H.row === T.row) {
        newTail.col += colInc;
    } else if (H.col === T.col) {        
        newTail.row += rowInc;
    } else {
        // both different, have to move diagonally
        newTail.col += colInc;
        newTail.row += rowInc;
    }

    if (!isTouching({ H, T: newTail })) {
        throw new Error(`Unexpected! H: ${H}, T: ${T}, newT: ${newTail} still doesn't touch!`);
    }

    return newTail;
}


function move({H, T}: HeadTail, dir: Direction ): HeadTail {
    switch (dir) {
        case 'U': H.row -= 1; break; // up            
        case 'D': H.row += 1; break; // down
        case 'L': H.col -= 1; break; // left    
        case 'R': H.col += 1; break; // right 
    }

    const newTail = getNewTail({H, T});
    return { H, T: newTail };
}

function parseInput(input: string): Directions {
    const dirs: Directions = [];
    const instructions = input.split('\n');
    for (const instruction of instructions) {
        const [dir, count] = instruction.split(' ') as [Direction, string];
        for (let c = 0; c < parseInt(count, 10); c+= 1) {
            dirs.push(dir);
        }
    }

    return dirs;
}

function updateTrail(trailMap: TrailMap, {H, T}: HeadTail): TrailMap {
    // first, update the row and col minmaxes based on the current headTail
    trailMap.row.max = Math.max(H.row, T.row, trailMap.row.max);
    trailMap.row.min = Math.min(H.row, T.row, trailMap.row.min);

    trailMap.col.max = Math.max(H.col, T.col, trailMap.col.max);
    trailMap.col.min = Math.min(H.col, T.col, trailMap.col.min);

    // update the trail and set the position of the current trail
    trailMap.trail[T.row] = trailMap.trail[T.row] || {};
    trailMap.trail[T.row][T.col] = true;

    return trailMap;
}

// this method is expensive
function drawTrail(trailMap: TrailMap, {H, T}: HeadTail): string {
    // now draw everything
    let output = '';
    for (let row = trailMap.row.min; row <= trailMap.row.max; row += 1) {
        for (let col = trailMap.col.min; col <= trailMap.col.max; col += 1) {
            if (H.row === row && H.col === col) {
                output += 'H';
            } else if (T.row === row && T.col === col) {
                output += 'T';
            } else if ((trailMap.trail[row] ?? [])[col]) {
                output += '#';
            } else {
                output += '.';
            }
        }
        output += '\n';
    }

    return output;
}

function positionsTailVisited(trailMap: TrailMap): number {
    let visited = 0;
    for (const row in trailMap.trail) {
        visited += Object.keys(trailMap.trail[row]).length;
    }
    return visited;
}

export default function() {
    let headTail = { H: { row: 0, col: 0 }, T: { row: 0, col: 0 }};
    const trailMap: TrailMap = {
        trail: {
            '0': {
                '0': true
        }},
        row: {
            max: 0,
            min: 0
        },
        col: {
            max: 0,
            min: 0
        }
    };

    const directions: Directions = parseInput(input);

    for (const dir of directions) {
        updateTrail(trailMap, headTail);
        headTail = move(headTail, dir);
    }

    const finalMap = drawTrail(trailMap, headTail);
    const visited = positionsTailVisited(trailMap);
    
    console.log(finalMap);

    return { directions, visited };
}
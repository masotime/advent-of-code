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
type MultiHeadTail = Array<HeadTail>;

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


function move(multiHeadTail: MultiHeadTail, dir: Direction ): MultiHeadTail {

    // for a multi-head tail
    // 1. move the first HT
    // 2. for the remaining HTs
    //   a. set the head of the next HT to the tail of the previous HT.
    //   b. calculate the new tail of the next HT
    //   c. repeat a-c until you reach the end
    
    const topHT = multiHeadTail[0];
    switch (dir) {
        case 'U': topHT.H.row -= 1; break; // up            
        case 'D': topHT.H.row += 1; break; // down
        case 'L': topHT.H.col -= 1; break; // left    
        case 'R': topHT.H.col += 1; break; // right 
    }
    topHT.T = getNewTail({ H: topHT.H, T: topHT.T });

    for (let i = 1; i < multiHeadTail.length; i += 1) {
        const prevHT = multiHeadTail[i - 1];
        const currentHT = multiHeadTail[i];

        currentHT.H = prevHT.T;
        currentHT.T = getNewTail({ H: currentHT.H, T: currentHT.T });
    }

    return multiHeadTail;
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

function updateTrail(trailMap: TrailMap, multiHeadTail: MultiHeadTail): TrailMap {
    // first, update the row and col minmaxes based on only the top headTail
    // NOTE: This is an assumption that all the "followers" cannot go beyond the top
    // headTail.
    const { H, T } = multiHeadTail[0];
    trailMap.row.max = Math.max(H.row, T.row, trailMap.row.max);
    trailMap.row.min = Math.min(H.row, T.row, trailMap.row.min);

    trailMap.col.max = Math.max(H.col, T.col, trailMap.col.max);
    trailMap.col.min = Math.min(H.col, T.col, trailMap.col.min);

    // next, update the trail with the position of the last tail
    const { H: lastH } = multiHeadTail[multiHeadTail.length - 1];
    trailMap.trail[lastH.row] = trailMap.trail[lastH.row] || {};
    trailMap.trail[lastH.row][lastH.col] = true;

    return trailMap;
}

// this method is expensive
function drawTrail(trailMap: TrailMap, multiHeadTail: MultiHeadTail): string {
    // now draw everything
    let output = '';
    for (let row = trailMap.row.min; row <= trailMap.row.max; row += 1) {
        for (let col = trailMap.col.min; col <= trailMap.col.max; col += 1) {
            // here we iterate through every headTail and map it out in priority
            // the assumption is that we never go beyond 10 knots - i.e. H,1,2,3...9
            // start with the first knot
            let knotSet = false;
            if (multiHeadTail[0].H.row === row && multiHeadTail[0].H.col === col) {
                output += 'H';
                knotSet = true;
            } else {
                // figure out 1..9, set otherKnotSet if at least one is suitable
                for (let i=1; i < multiHeadTail.length; i+= 1) {
                    const { H } = multiHeadTail[i];
                    if (H.row === row && H.col === col) {
                        knotSet = true;
                        output += String(i);
                        break; // this will cover the rest even if they are at the same position.
                    }
                }
            }

            if (!knotSet) {
                if ((trailMap.trail[row] ?? [])[col]) {
                    output += '#';
                } else {
                    output += '.';
                }    
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
    let multiHeadTail = [
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 1
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 2
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 3
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 4
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 5
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 6
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 7
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 8
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 9
        { H: { row: 0, col: 0 }, T: { row: 0, col: 0 } }, // 10
    ];

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
        updateTrail(trailMap, multiHeadTail);
        // console.log(drawTrail(trailMap, multiHeadTail));
        multiHeadTail = move(multiHeadTail, dir);
    }

    // one last update for the last move
    updateTrail(trailMap, multiHeadTail);

    const finalMap = drawTrail(trailMap, multiHeadTail);
    const visited = positionsTailVisited(trailMap);
    
    console.log(finalMap);

    return { directions, visited };
}
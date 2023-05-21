import input from './input';

type Map = Array<Array<number>>;
type Direction = 'up' | 'down' | 'left' | 'right';

function convertInputToMap(input: string): Map {
    return input.split('\n').map(line => line.split('').map(num => parseInt(num, 10)));
}

/* The "score" map is also calculated in 4 sweeps + 1 sweep to get the actual scores.
   The first 4 sweeps calculate the "tree visibility" from each direction, then the final
   sweep multiplies the values across all of the previous 4 sweeps into a final grid.

   For example, given

   30373
   25512
   65332
   33549
   35390

   Sweep 1: (left to right - shows sweep map values)

   00000      0|0000      01|000      012|00      0123|0      01231|      
   00000      0|0000      01|000      011|00      0111|0      01112|      
   00000 ===> 0|0000 ===> 01|000 ===> 011|00 ===> 0111|0 ===> 01111|
   00000      0|0000      01|000      012|00      0121|0      01214|      
   00000      0|0000      01|000      011|00      0113|0      01131|      

   basically while sweeping in one direction
   1. create a new sweep map M initialized to all 0
   2. consider the sweep map value on the left S (or -1 if there is no such value)
   3. consider the tree height on the left P (or 0 if there is no such value)
   4. consider the height of the current tree C (for current)
   5a. if C <= P, then it's simply set to 1.   
   5b. if C > P, then we add the sweep value S, but we must keep searching.
     i. check the tree at steps (P - sweep value) away, P2 with value S2
       C > P2? Continue to add S2 and repeat the process
     ii. otherwise add 1 and stop.  

   NOTE: Avoid || operator - 0 is "falsy", so 0 || -1 = -1, even though you want 0.
*/

type Coordinate = {
    row: number,
    col: number
}

type Navigator = (start: Coordinate, steps: number) => Coordinate;

function makeNavigator(dir: Direction): Navigator {
    return ({ row, col }: Coordinate, steps: number) => {
        switch (dir) {
            case 'up':
                return { row: (row - steps), col };
            case 'down':
                return { row: (row + steps), col };
            case 'left':
                return { row, col: (col - steps) };
            case 'right':            
                return { row, col: (col + steps) }
        }
    }
}

// creates a calulator with a given context (inputMap, sweepMap and direction)
function makeCalculator(inputMap: Map, sweepMap: Map, dir: Direction, viewHeight: number) {
    const navigate = makeNavigator(dir);

    return function calculate(current: Coordinate, steps: number): number {
        const { row, col } = navigate(current, steps);
        // console.log(`I am now at [${current.row}, ${current.col}] and looking from the ${dir}. My height is ${viewHeight} and I plan to check the tree at [${row}, ${col}]`);
        const nextTreeHeight = (inputMap[row] ?? [])[col];
        const nextTreeVisibility = (sweepMap[row] ?? [])[col];

        if (nextTreeHeight === undefined) {
            // console.log(`There's no tree at [${row}, ${col}] so I stop and give up.`);
            return 0;
        } else if (viewHeight <= nextTreeHeight) {
            // console.log(`I'm not taller than the tree at [${row}, ${col}] which is ${nextTreeHeight} tall so I stop after adding the steps ${steps} to get to this tree.`);
            return steps;
        } else if (nextTreeVisibility === 0) {
            // console.log('The next tree must be at the edge of the map since it has 0 visibility, so I stop');
            return steps;
        } else {
            // console.log(`I'm taller than the tree at [${row}, ${col}] which is ${nextTreeHeight} tall so count the steps (${steps}) to it and check the tree it can't see beyond (${nextTreeVisibility}) away.`);
            return steps + calculate({ row, col }, nextTreeVisibility);
        }
    }
}

function createMap(inputMap: Map, fillFunction: () => any) {
    const height = inputMap.length;
    const width = inputMap[0].length;

    return (new Array(height).fill(null)).map(elem => new Array(width).fill(fillFunction()));
}

function constructScoreMap(inputMap: Map): Map {
    const height = inputMap.length;
    const width = inputMap[0].length;
    const maps: { [K in Direction]: Map } = {
        left: createMap(inputMap, () => 0),
        right: createMap(inputMap, () => 0),
        down: createMap(inputMap, () => 0),
        up: createMap(inputMap, () => 0)
    }
    const dirs: Array<Direction> = ['up', 'down', 'left', 'right'];

   // scan left to right
    for (let col = 0; col < width; col += 1) {
        for (let row = 0; row < height; row += 1) { // row scan order doesn't really matter here
            const viewHeight = inputMap[row][col];
            const calc = makeCalculator(inputMap, maps['left'], 'left', viewHeight);
            maps['left'][row][col] = calc({ row, col }, 1);
        }
    }

   // scan right to left
   for (let col = width - 1; col >= 0; col -= 1) {
       for (let row = 0; row < height; row += 1) { // row scan order doesn't really matter here
           const viewHeight = inputMap[row][col];
           const calc = makeCalculator(inputMap, maps['right'], 'right', viewHeight);
           maps['right'][row][col] = calc({ row, col }, 1);
       }
   }

   // scan top to bottom
   for (let row = 0; row < height; row += 1) {
       for (let col = 0; col < width; col += 1) { // col scan order doesn't really matter here
           const viewHeight = inputMap[row][col];
           const calc = makeCalculator(inputMap, maps['up'], 'up', viewHeight);
           maps['up'][row][col] = calc({ row, col }, 1);
       }
   }

   // scan from bottom to top
    for (let row = height - 1; row >= 0; row -= 1) {
        for (let col = 0; col < width; col += 1) { // col scan order doesn't really matter here
            const viewHeight = inputMap[row][col];
            const calc = makeCalculator(inputMap, maps['down'], 'down', viewHeight);
            maps['down'][row][col] = calc({ row, col }, 1);
        }
    }
    
    console.log(maps);

    // we now have all 4 maps, so we compute the final value
    const scoreMap = createMap(inputMap, () => 1);
    for (let col = 0; col < width; col += 1) {
        for (let row = 0; row < height; row += 1) { // row scan order doesn't really matter here
            scoreMap[row][col] = dirs.reduce((score, dir) => {
                return score * maps[dir][row][col];
            }, 1)
        }
    }

    return scoreMap;
}

function findLargest(scoreMap: Map) {
    return Math.max(...scoreMap.flat());
}

export default function() {
    const inputMap = convertInputToMap(input);
    const scoreMap = constructScoreMap(inputMap);
    return findLargest(scoreMap);
}
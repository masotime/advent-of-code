import input from './input';

type Map = Array<Array<number>>;

function convertInputToMap(input: string): Map {
    return input.split('\n').map(line => line.split('').map(num => parseInt(num, 10)));
}

/* The barrier map is calculated in 4 sweeps, and it gives, for a given coordinate,
   the minimum height to be visible.

   For example, given

   30373
   25512
   65332
   33549
   35390

   the barrier map would be interatively calculated as follows

   Sweep 1: (left to right - X = 10, basically impossible to be viewed from that side)

   XXXXX      0XXXX      04XXX      044XX      0444X      04448      
   XXXXX      0XXXX      03XXX      036XX      0366X      03666      
   XXXXX ===> 0XXXX ===> 07XXX ===> 077XX ===> 0777X ===> 07777
   XXXXX      0XXXX      04XXX      044XX      0446X      04466      
   XXXXX      0XXXX      04XXX      046XX      0466X      0466X      

   basically while sweeping in one direction
   1. create a new sweep map M initialized to all X
   2. consider the barrier value on the left in the sweep map M called B (or 0 if there is no value)
   3. plus the tree on the left T (or -1 if there is no tree)
   4. Plus any existing value E (or 10 if there is no existing value)
   the value of the square on the "sweep map" S = Math.max(T+1, B)
   the value of that square must be Math.min(S, E)

   repeat the algorithm for the other directions, replacing any existing values
   if a new value is SMALLER than the existing one (i.e. just needs to be visible from ONE edge)

   Sweep 2: (right to left)

   1. create a new map sweep M initialized to all X
   2. consider the barrier value on the right in the sweep map M, called B (or 0 if there is no value)
   2. plus the tree on the right T (or -1 if there is no tree)
   4. Plus any existing value E (or 10 if there is no existing value)
   the value of the square on the "sweep map" S = Math.max(T+1, B)
   the value of that square must be Math.min(S, E)

   04448      04440      04440     
   03666      03660      03630          
   07777 ===> 07770 ===> 07730 ===> etc...
   04466      04460      04460      
   0466X      04660      04610      

   NOTE: Avoid || operator - 0 is "falsy", so 0 || -1 = -1, even though you want 0.
*/

function createMap(inputMap: Map, fillFunction: () => any) {
    const height = inputMap.length;
    const width = inputMap[0].length;

    return (new Array(height).fill(null)).map(elem => new Array(width).fill(fillFunction()));
}

function constructBarrierMap(inputMap: Map): Map {
    const height = inputMap.length;
    const width = inputMap[0].length;

    // I can't chain fill... because new Array is the same instance filled to each
    // element in the outermost array !@#$
    const barrierMap = createMap(inputMap, () => 10);

    console.log('initialization', barrierMap);
    // scan left to right
    const ltrMap = createMap(inputMap, () => 10);
    for (let col = 0; col < width; col += 1) {
        for (let row = 0; row < height; row += 1) { // row scan order doesn't really matter here
            const B = ltrMap[row][col - 1] ?? 0;
            const T = inputMap[row][col - 1] ?? -1;
            const E = barrierMap[row][col];
            ltrMap[row][col] = Math.max(T+1, B);
            barrierMap[row][col] = Math.min(ltrMap[row][col], E);
        }
    }

    console.log('after ltr', barrierMap);

    // scan right to left
    const rtlMap = createMap(inputMap, () => 10);
    for (let col = width - 1; col >= 0; col -= 1) {
        for (let row = 0; row < height; row += 1) { // row scan order doesn't really matter here
            const B = rtlMap[row][col + 1] ?? 0;
            const T = inputMap[row][col + 1] ?? -1;
            const E = barrierMap[row][col];
            rtlMap[row][col] = Math.max(T+1, B);
            barrierMap[row][col] = Math.min(rtlMap[row][col], E);            
        }
    }

    console.log('after rtl', barrierMap);

    // scan top to bottom
    const ttbMap = createMap(inputMap, () => 10);
    for (let row = 0; row < height; row += 1) {
        for (let col = 0; col < width; col += 1) { // col scan order doesn't really matter here
            const B = (ttbMap[row - 1] ?? [])[col] ?? 0;
            const T = (inputMap[row - 1] ?? [])[col] ?? -1;
            const E = barrierMap[row][col];
            ttbMap[row][col] = Math.max(T+1, B);
            barrierMap[row][col] = Math.min(ttbMap[row][col], E);
        }
    }

    console.log('after ttb', barrierMap);

    // scan bottom to top
    const bttMap = createMap(inputMap, () => 10);
    for (let row = height - 1; row >= 0; row -= 1) {
        for (let col = 0; col < width; col += 1) { // col scan order doesn't really matter here
            const B = (bttMap[row + 1] ?? [])[col] ?? 0;
            const T = (inputMap[row + 1] ?? [])[col] ?? -1;
            const E = barrierMap[row][col];
            bttMap[row][col] = Math.max(T+1, B)
            barrierMap[row][col] = Math.min(bttMap[row][col], E);
        }
    }

    console.log('after btt', barrierMap);

    return barrierMap;
}

function calculateVisible(inputMap: Map, barrierMap: Map): { visibleCount: number, visibleMap: Map } {
    let visibleCount = 0;
    const height = inputMap.length;
    const width = inputMap[0].length;
    const visibleMap = createMap(inputMap, () => false);

    for (let row = 0; row < height; row += 1) {
        for (let col = 0; col < width; col += 1) {
            if (inputMap[row][col] >= barrierMap[row][col]) {
                visibleCount += 1;
                visibleMap[row][col] = true;
            }
        }
    }

    return { visibleCount, visibleMap };
}

export default function() {
    const inputMap = convertInputToMap(input);
    const barrierMap = constructBarrierMap(inputMap);
    const { visibleCount, visibleMap } = calculateVisible(inputMap, barrierMap);
    console.log({ inputMap, barrierMap, visibleMap })
    return visibleCount;
}
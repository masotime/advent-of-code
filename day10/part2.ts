import input from './input';

type InstructionType = 'noop' | 'addx';

type Instruction = {
    type: InstructionType,
    arg: string | void
};

type Instructions = Array<Instruction>;

const instructionCost: { [K in InstructionType]: number} = {
    noop: 1,
    addx: 2
}

const instructionEffect: { [K in InstructionType]: (reg: number, arg: string | void) => number } = {
    noop: (X, _) => X,
    addx: (X, arg) => X + (arg ? parseInt(arg, 10) : 0)
}

// maps every cycle number to an index in the instructions array as well as the value of the register X
type CycleMap = {
    [cycle: number]: {
        instructionIndex: number,
        X: number // at the end of the cycle,
        spriteMap: string, // length 40
        crtMap: string, // length 240, 6 rows, 40 columns
    }
}

function getSpriteMap(X: number): string {
    const row = new Array(40).fill('.');
    X >= 1 && (row[X-1] = '#');
    row[X] = '#';
    X <= 38 && (row[X+1] = '#');
    return row.join('');
}

function formatCrtMap(crtMap: string): string {
    return crtMap.replace(/(.{40})/g, "$1\n")
}

function parseInput(input: string): { cycleMap: CycleMap, instructions: Instructions } {
    const cycleMap: CycleMap = {};
    const instructions: Instructions = [];
    const lines = input.split('\n');
    let cycle = 1, X = 1;

    const crtMap = new Array(240).fill(' ');

    for (const line of lines) {
        const [type, arg] = line.split(' ') as [InstructionType, string | void];
        const cost = instructionCost[type];        

        instructions.push({ type, arg });
        for (let i = 0; i < cost; i += 1, cycle += 1) {            
            const spriteMap = getSpriteMap(X);
            const spriteIndex = (cycle - 1) % 40;
            const crtIndex = (cycle - 1) % 240;
            crtMap[crtIndex] = spriteMap[spriteIndex] === '#' ? '#' : '.';
            cycleMap[cycle] = {
                instructionIndex: instructions.length - 1,
                X,
                spriteMap,

                // it's expensive to store a new array of this for each cycle
                // but it's useful for debugging
                crtMap: formatCrtMap(crtMap.join(''))
            }
            console.log(cycleMap[cycle].crtMap);
        }

        // actually have the instruction take effect for this cycle
        X = instructionEffect[type](X, arg);
        // cycleMap[cycle - 1].X = X;
    }

    return {
        cycleMap,
        instructions
    };

}

function getSignalStrengths(cycles: Array<number>, cycleMap: CycleMap): number {
    let sum = 0;
    for (const cycle of cycles) {
        sum += cycleMap[cycle].X * cycle;
    }
    return sum;
}

export default function() {
    const { cycleMap, instructions } = parseInput(input);
    const signalStrengthSum = getSignalStrengths([20, 60, 100, 140, 180, 220], cycleMap);
    return { };
}
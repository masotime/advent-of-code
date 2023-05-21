import input from './input';

// given a stack indexed by e.g. 1,2,3
// and a line e.g. [Z] [M] [P]
// this type would represent e.g. { 1: 'Z', 2: 'M', 3: 'P' }
type StackHorizon = {
    [index: string]: string
};

type Stacks = {
    [index: string]: Array<string>
};

type Instruction = {
    count: number,
    from: string,
    to: string
};

type Instructions = Array<Instruction>;

function splitParts(raw: string): {rawStacks: string, rawInstructions: string} {
    const [rawStacks, rawInstructions] = raw.split('\n\n');
    return {
        rawStacks, rawInstructions
    };
}

function convertStackLine(stackLine: string, stackNames: Array<string>): StackHorizon {
    // stackLine can be something like '    [B] [C]     [E]'
    const stackMatch = stackLine.match(/[ ]{4}|\[[A-Z]\]( |$)/g);

    if (!stackMatch) {
        return {};
    }
    
    // output of this is e.g. [undefined, 'B', 'C', undefined, 'E']
    const stackParts = stackMatch?.map(part => part.trim().length > 0 ? part.replace(/[\[\]\s]/g,'') : undefined) ?? [];

    // go through each name. e.g. if the names were ['1', '2', '3']
    // then if we were at '2', which has an index of 1, we check stackParts[1]
    // if it is defined (e.g. with a value 'B'), then we assign { '2': 'B' }
    // i.e. [undefined, 'B', 'C'] - at 'B', the index is 1, and the name at index 1 is '2'
    // so we set { '2': 'B' }
    return stackNames.reduce((acc: StackHorizon, stackName: string, index: number) => {
        const stackValue = stackParts[index];
        if (stackValue) {
            acc[stackName] = stackValue;
        }
        return acc;
    }, {});
}

// given e.g. ' 1   2   3 ', returns ['1', '2', '3']
function getStackNames(rawStackLines: Array<string>): Array<string> {
    return rawStackLines[rawStackLines.length - 1].split(/\s+/).filter(_ => _);    
}

function defineStacks(rawStacks: string): Stacks {
    const rawStackLines = rawStacks.split('\n');
    const stackNames = getStackNames(rawStackLines);
    const rawStackDiagram = rawStackLines.slice(0, -1);
    const convertedStackDiagram = rawStackDiagram.map((stackLine => convertStackLine(stackLine, stackNames)));

    // now with each stack line, we define a mapping of { stackName: []}, where we continuously unshift
    // into the array for that stack if we encounter a value for that stackName.
    //
    //  e.g. for a given stack horizon {2: D}
    //       and another stack horizon {1: A, 2: B, 3: C}'
    // we would produce { 1: [A], 2: [B, D], 3: [C] }    
    return convertedStackDiagram.reduce((stacks: Stacks, stackHorizon: StackHorizon) => {
        for (const stackName in stackHorizon) {
            if (!stacks[stackName]) {
                stacks[stackName] = [];
            }

            stacks[stackName].unshift(stackHorizon[stackName]);
        }

        return stacks;
    }, {})
}

function defineInstructions(rawInstructions: string): Instructions {
    // instructions are in the form "move 1 from 2 to 1"
    const instructionRegExp = /^move ([^\s]+) from ([^\s]+) to ([^\s]+)$/;
    const instructionLines = rawInstructions.split('\n');

    return instructionLines.map((line) => {
        const matchArray = line.match(instructionRegExp);

        if (!matchArray) {
            return { count: 0, from: '', to : ''};
        }

        return {
            count: parseInt(matchArray[1], 10),
            from: matchArray[2],
            to: matchArray[3]
        };
    });
}

function applyInstructions(stacks: Stacks, instructions: Instructions): void {
    // run through the instructions and adjust the stacks accordingly
    // mutate the stacks in the process
    for (const instruction of instructions) {
        const { count, from, to } = instruction;
        for (let i = 0; i < count; i += 1) {
            const popped = stacks[from].pop();
            popped && stacks[to].push(popped);
        }
    }
}

function getTopOfStacks(stackNames: Array<string>, stacks: Stacks): string {
    let result = '';
    for (const stackName of stackNames) {
        const stack = stacks[stackName];
        result += stack[stack.length - 1];
    }
    return result;
}

export default function() {
    const { rawStacks, rawInstructions } = splitParts(input);
    const stackNames = getStackNames(rawStacks.split('\n'));
    const stacks = defineStacks(rawStacks);
    const instructions = defineInstructions(rawInstructions);

    applyInstructions(stacks, instructions);

    return getTopOfStacks(stackNames, stacks);
    // return convertStackLine('[Z] [M] [P]', getStackNames(rawStacks.split('\n')));
}
import input from './input';

// this is obviously a spreadsheet

type Operation = '+' | '-' | '*' | '/';
type Cell = { name: string } & {
    type: 'formula'
    leftCell: string,
    rightCell: string
    operation: '+' | '-' | '*' | '/'
} | {
    type: 'value',
    value: number
};

type Spreadsheet = {
    [name: string]: Cell
};


// using fancy named groups (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match#using_named_capturing_groups)
const LINE_REGEX = /^(?<name>[a-z]+): (?<value>[0-9]+|(?<leftCell>[a-z]+) (?<operation>[\+\-\*\/]) (?<rightCell>[a-z]+))$/;
function parse(input: string): Spreadsheet {
    const spreadsheet: Spreadsheet = {};
    const lines = input.split('\n');

    for (const line of lines) {
        const result = line.match(LINE_REGEX);
        if (!result || !result.groups) {
            throw new Error(`Could not parse [${line}]`);
        }

        const groups = result.groups;
        
        if (groups.name && groups.operation && groups.leftCell && groups.rightCell && groups.operation) {
            spreadsheet[groups.name] = {
                type: 'formula',
                name: groups.name,
                leftCell: groups.leftCell,
                rightCell: groups.rightCell,
                operation: groups.operation as Operation
            };
        } else if (groups.value) {
            spreadsheet[groups.name] = {
                type: 'value',
                value: parseInt(groups.value, 10)
            };
        } else {
            throw new Error(`Could not recognize the regex groups matched in ${JSON.stringify(result)}`);
        }
    }

    return spreadsheet;
}

function computeCell(spreadsheet: Spreadsheet, cellName: string): number {
    const cell = spreadsheet[cellName];

    if (!cell) {
        throw new Error(`No such cell defined: ${cellName}`);
    }

    if (cell.type === 'value') {
        return cell.value;
    } else {
        // recursion - evaluate the cell formula
        const { leftCell, operation, rightCell } = cell;
        const leftValue = computeCell(spreadsheet, leftCell);
        const rightValue = computeCell(spreadsheet, rightCell);

        switch(operation) {
            case '*':
                return leftValue * rightValue;
            case '+':
                return leftValue + rightValue;
            case '-':
                return leftValue - rightValue;
            case '/':
                return leftValue / rightValue;
        }

        throw new Error(`wtf, encountered unknown operation ${operation}`);
    }
}

export default function() {
    const spreadsheet = parse(input);

    console.log(spreadsheet);

    const rootValue = computeCell(spreadsheet, 'root');

    return rootValue;
}
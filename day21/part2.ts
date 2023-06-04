import input from './input';

// this is obviously a spreadsheet

type Operation = '+' | '-' | '*' | '/' | '=';
type FormulaCell = {
    name: string
    type: 'formula'
    leftCell: string,
    rightCell: string
    operation: Operation,
    unknownCell: string | void
};

type ValueCell = {
    name: string
    type: 'value',
    value: number
};

type Cell = FormulaCell | ValueCell;

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
                operation: groups.operation as Operation,
                unknownCell: undefined // for pt 2
            };
        } else if (groups.value) {
            spreadsheet[groups.name] = {
                type: 'value',
                name: groups.name,
                value: parseInt(groups.value, 10),
            };
        } else {
            throw new Error(`Could not recognize the regex groups matched in ${JSON.stringify(result)}`);
        }
    }

    return spreadsheet;
}

function fixSpreadsheet(spreadsheet: Spreadsheet): Spreadsheet {
    // "fix" the spreadsheet per the specfications for part 2
    const rootCell = spreadsheet['root'];
    const humanCell = spreadsheet['humn'];
    
    if (rootCell.type !== 'formula') {
        throw new Error('The cell named "root" is not a formula.')
    } else if (humanCell.type !== 'value') {
        throw new Error('The cell named "humn" is not a value');
    }

    rootCell.operation = '=';
    delete spreadsheet['humn'];

    markUnknown(spreadsheet, 'root');

    return spreadsheet;
}

// recurse through the spreadsheet and mark formulas with an unknown
// value directly or indirectly (i.e. humn)
function markUnknown(spreadsheet: Spreadsheet, cellName: string): boolean {
    const cell = spreadsheet[cellName];

    if (cell === undefined) {
        return true;
    }

    if (cell.type === 'value') {
        return false;
    }

    const leftUnknown = markUnknown(spreadsheet, cell.leftCell);
    const rightUnknown = markUnknown(spreadsheet, cell.rightCell);
    cell.unknownCell = leftUnknown ? cell.leftCell : rightUnknown ? cell.rightCell : undefined;

    return cell.unknownCell !== undefined;
}

// this is from part 1 and remains unchanged
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
            case '=':
                throw new Error('Cannot compute the value of a cell with =');
        }

        throw new Error(`wtf, encountered unknown operation ${operation}`);
    }
}

function solver(spreadsheet: Spreadsheet, formulaCell: FormulaCell, desiredValue: number): number {
    console.log(`Solving ${formulaCell.name}: ${formulaCell.leftCell} ${formulaCell.operation} ${formulaCell.rightCell} = ${desiredValue}`);
    if (!formulaCell.unknownCell) {
        throw new Error(`No unknown to solve for given formula cell ${formulaCell}`);
    }

    const {
        rightCell: rightCellName,
        leftCell: leftCellName,
        unknownCell: unknownCellName
    } = formulaCell;

    const [knownSide, knownCellName] = leftCellName === unknownCellName ? ['right', rightCellName] : ['left', leftCellName];
    
    const knownValue = computeCell(spreadsheet, knownCellName);
    const unknownCell = spreadsheet[unknownCellName];

    // work in reverse
    let nextDesiredValue = undefined;
    switch (formulaCell.operation) {
        // for * and +, order doesn't matter
        case '*': 
            nextDesiredValue = desiredValue / knownValue; break;
        
        case '+': {
            nextDesiredValue = desiredValue - knownValue; break;
        }

        // order matters here
        case '-': {
            if (knownSide === 'left') {
                // k - ? = desiredValue
                // ? = k - desiredValue
                nextDesiredValue = knownValue - desiredValue; break;
            } else {
                // ? - k = desiredValue
                // ? = desiredValue + k
                nextDesiredValue = desiredValue + knownValue; break;
            }
        }
        case '/': {
            if (knownSide === 'left') {
                // k / ? = desiredValue
                // ? = k / desiredValue
                nextDesiredValue = knownValue / desiredValue; break;
            } else {
                // ? / k = desiredValue
                // ? = desiredValue * k
                nextDesiredValue = desiredValue * knownValue; break;
            }
        }

        case '=':
            throw new Error(`I can't solve for another equation`);
    }
    
    console.log(`We know that ${knownCellName} has a value of ${knownValue}, so we solve for ${unknownCellName} which should be ${nextDesiredValue}`);

    if (unknownCell === undefined) {
        // we are done, this is probably humn
        console.log(`We have out solution. ${unknownCellName} is undefined, and thus, must be ${nextDesiredValue}`);
        return nextDesiredValue;
    } else if (unknownCell.type !== 'formula') {
        throw new Error(`Makes no sense, cell ${unknownCellName} is not a formula cell! ${JSON.stringify(unknownCell)}`);
    }

    return solver(spreadsheet, unknownCell, nextDesiredValue);
}


function solve(spreadsheet: Spreadsheet, cellName: string): number {
    const cell = spreadsheet[cellName];

    if (cell.type !== 'formula') {
        throw new Error(`Can't solve a cell which is not a formula ${JSON.stringify(cell)}`);
    } else if (cell.operation !== '=') {
        throw new Error(`Can't solve a cell which is not an = operation. Got operation ${cell.operation} instead`);
    } else if (cell.unknownCell === undefined) {
        throw new Error(`Neither ${cell.leftCell} nor ${cell.rightCell} appear to be unknown. Did you run the markUnknown function?`);
    }

    const knownCell = cell.leftCell === cell.unknownCell ? cell.rightCell : cell.leftCell;
    const valueToEquate = computeCell(spreadsheet, knownCell);
    const unknownCell = spreadsheet[cell.unknownCell];

    if (unknownCell.type !== 'formula') {
        return unknownCell.value; // this really cannot happen but whatever
    }

    const solution = solver(spreadsheet, unknownCell, valueToEquate);

    return solution;
}


export default function() {
    const spreadsheet = parse(input);
    const fixedSheet = fixSpreadsheet(spreadsheet);
    const rootCell = fixedSheet.root;
    if (rootCell.type !== 'formula') {
        throw new Error('wtf');
    }

    console.log(fixedSheet);
    const solution = solve(fixedSheet, 'root');
    // const rhs = computeCell(spreadsheet, rootCell.rightCell);

    // console.log(rhs);
    return solution;
}
import type { Coordinate, World } from './part2';

function initLimitsIfNeeded(world: World, coord: Coordinate): void {
    const { rowLimits, colLimits } = world.board;
    const { row, col } = coord;

    if (!rowLimits[row]) {
        rowLimits[row] = {
            min: col,
            max: col
        };
    }    

    if (!colLimits[col]) {
        colLimits[col] = {
            min: row,
            max: row
        };
    }

    rowLimits[row].min = Math.min(rowLimits[row].min, col);
    rowLimits[row].max = Math.max(rowLimits[row].max, col);
    colLimits[col].min = Math.min(colLimits[col].min, row);
    colLimits[col].max = Math.max(colLimits[col].max, row);
}

const INSTRUCTIONS_LINE_REGEX = /([0-9]+[RL])/g;
const INSTRUCTION_INPUT_REGEX = /(?<move>[0-9]+)(?<turn>[RL])/;
export function parse(input: string): World {
    const world: World = {
        board: {
            grid: {},
            rowLimits: {},
            colLimits: {}
        },
        instructions: [],
        finalMove: 0
    };

    const [boardInput, instructionsInput] = input.split('\n\n');

    // parse out the board
    const boardPart = boardInput.split('\n');
    const rows = boardPart.length;

    for (let row = 0; row < rows; row += 1) {
        const rowString = boardPart[row];
        const cols = rowString.length;
        const rowData: Array<string> = []; // easier to visualize compared to an object
        world.board.grid[row] = rowData;

        for (let col = 0; col < cols; col += 1) {
            const letter = rowString[col];
            if (letter !== ' ') {
                initLimitsIfNeeded(world, { row, col });                
                world.board.grid[row][col] = letter;
            }
        }
    }


    // parse out the instructions
    const instructionsPart = instructionsInput.match(INSTRUCTIONS_LINE_REGEX);

    if (instructionsPart === null) {
        throw new Error(`No instructions in input? ${instructionsInput}`);
    }

    for (const instructionInput of instructionsPart) {
        const groups = instructionInput.match(INSTRUCTION_INPUT_REGEX)?.groups;
        if (groups === undefined) {
            throw new Error(`Could not parse isntruction input [${instructionInput}]`);            
        } else if (groups.turn !=='R' && groups.turn !== 'L') {
            throw new Error(`Read an unknown turn instruction ${groups.turn}`)
        }

        world.instructions.push({
            move: parseInt(groups.move, 10),
            turn: groups.turn
        });
    }

    // parse out the final move
    const FINAL_MOVE_REGEX = /(?<finalMove>[0-9]+)$/;
    const finalMatch = instructionsInput.match(FINAL_MOVE_REGEX);
    const finalMove = finalMatch?.groups?.finalMove;

    if (!finalMove) {
        throw new Error(`${instructionsInput} has no final move`);
    }

    world.finalMove = parseInt(finalMove, 10);

    return world;
}
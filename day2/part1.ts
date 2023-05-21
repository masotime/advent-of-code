import input from './input';

type Choice = 'rock' | 'paper' | 'scissors';
type Outcome = 'win' | 'lose' | 'draw';
type ThemChar = 'A' | 'B' | 'C';
type YouChar = 'X' | 'Y' | 'Z';

const char2Choice: { [char: string]: Choice } = {
    // rocks
    A: 'rock',
    X: 'rock',

    // paper
    B: 'paper',
    Y: 'paper',

    // scissors
    C: 'scissors',
    Z: 'scissors'
};

const choiceScore: { [choice in Choice]:  number } = {
    rock: 1,
    paper: 2,
    scissors: 3
};

const outcomeScore: { [outcome in Outcome]: number } = {
    lose: 0,
    draw: 3,
    win: 6,    
};

function outcomeType(line: string): Outcome {
    const [them, you] = line.split(' ') as [ThemChar, YouChar];

    const themChoice = char2Choice[them];
    const youChoice = char2Choice[you];

    switch (`${themChoice}-${youChoice}`) {
        case 'rock-paper':
        case 'scissors-rock':
        case 'paper-scissors':
            return 'win';

        case 'paper-rock':
        case 'rock-scissors':
        case 'scissors-paper':
            return 'lose';
        
        default:
            return 'draw';
    }
}

function yourChoice(line: string): Choice {
    const [,you] = line.split(' ') as [ThemChar,YouChar];

    return char2Choice[you];
}

function score(line: string): number {
    const outcome = outcomeType(line);
    const choice = yourChoice(line);

    return outcomeScore[outcome] + choiceScore[choice];
}

export default function() {
    return input.split('\n').map(line => score(line)).reduce((totalScore, score) => {
        return totalScore + score;
    }, 0);
}
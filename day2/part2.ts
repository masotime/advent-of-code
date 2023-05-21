import input from './input';

type Choice = 'rock' | 'paper' | 'scissors';
type Outcome = 'win' | 'lose' | 'draw';
type ThemChar = 'A' | 'B' | 'C';
type OutcomeChar = 'X' | 'Y' | 'Z';

const them2Choice: { [K in ThemChar]: Choice } = {
    A: 'rock',
    B: 'paper',
    C: 'scissors',
};

const char2Outcome: { [L in OutcomeChar]: Outcome } = {
    X: 'lose',
    Y: 'draw',
    Z: 'win'
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

function choiceForOutcome(theirChoice: Choice, desiredOutcome: Outcome): Choice {
    switch (desiredOutcome) {
        case 'win':
            switch (theirChoice) {
                case 'rock': return 'paper';
                case 'scissors': return 'rock';
                case 'paper': default: return 'scissors';
            }
        case 'lose':
            switch (theirChoice) {
                case 'rock': return 'scissors';
                case 'scissors': return 'paper';
                case 'paper': default: return 'rock';
            }
        case 'draw':
        default:
            return theirChoice;
    }
}

function yourChoice(line: string): Choice {
    const [themChar, outcomeChar] = line.split(' ') as [ThemChar,OutcomeChar];

    return choiceForOutcome(them2Choice[themChar], char2Outcome[outcomeChar]);
}

function desiredOutcome(line: string): Outcome {
    const [,outcomeChar] = line.split(' ') as [ThemChar,OutcomeChar];

    return char2Outcome[outcomeChar];
}

function score(line: string): number {
    const outcome = desiredOutcome(line);
    const choice = yourChoice(line);

    return outcomeScore[outcome] + choiceScore[choice];
}

export default function() {
    return input.split('\n').map(line => score(line)).reduce((totalScore, score) => {
        return totalScore + score;
    }, 0);
}
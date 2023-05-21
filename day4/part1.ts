import input from './input';

type Range = [number, number];

const sum = (arr: Array<number>) => arr.reduce((sum, num) => {
    return sum + num;
}, 0);

function getRange(part: string): Range {
    return part.split('-').map(str => parseInt(str, 10)) as Range;
}

function getRangePair(line: string): [lhs: Range, rhs: Range] {
    const [part1, part2] = line.split(',') as [string, string];
    return [getRange(part1), getRange(part2)];
}

function hasFullyContained(rangePair: [Range, Range]): boolean {
    const [[lower1, upper1], [lower2, upper2]] = rangePair;
    const range1Contains2 = lower1 <= lower2 && upper1 >= upper2;
    const range2Contains1 = lower2 <= lower1 && upper2 >= upper1;

    return range1Contains2 || range2Contains1;
}

export default function() {

    // debugging
    // return input.split('\n').map(getRangePair).map((rangePair: [Range, Range]) => {
    //     return `${JSON.stringify(rangePair)} => ${hasFullyContained(rangePair)}`;
    // });
    const rangePairs = input.split('\n').map(getRangePair);
    const containedPairs = rangePairs.map((pair => hasFullyContained(pair) ? 1 : 0));    
    return sum(containedPairs);
}
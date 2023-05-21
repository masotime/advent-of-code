import input from './input';

type ItemHash = {[item: string]: boolean};

const sum = (arr: Array<number>) => arr.reduce((sum, num) => {
    return sum + num;
}, 0);

function split(line: string): [string, string] {
    if (line.length % 2 !== 0) {
        throw new Error(`invalid input ${line} - does not have an even number of characters`);
    }

    const len = line.length;

    return [line.slice(0,len/2),line.slice(len/2, len)];
}

function makeHash(items: Array<string>): ItemHash {
    return items.reduce((hash: ItemHash, item: string) => {
        hash[item] = true;
        return hash;
    }, {});
}

function getCommonItem(line: string): string | void {
    const [part1, part2] = split(line);

    const part1Hash = makeHash(part1.split(''));
    const part2Hash =  makeHash(part2.split(''));

    for (const item in part1Hash) {
        if (part2Hash[item]) {
            return item;
        }
    }
}

function getItemPriority(c: string): number {
    const isLowercase = /[a-z]/.test(c);
    const charCode = c.charCodeAt(0);

    return isLowercase ? charCode - 97 + 1 : charCode - 65 + 27;
}

export default function() {
    const rucksacks = input.split('\n');
    const priorities = rucksacks.map((sack, idx) => {
        const commonItem = getCommonItem(sack);
        return commonItem ? getItemPriority(commonItem) : 0;
    });    
    return sum(priorities);
}
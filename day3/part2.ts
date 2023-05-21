import input from './input';

type ItemHash = {[item: string]: boolean};

const sum = (arr: Array<number>) => arr.reduce((sum, num) => {
    return sum + num;
}, 0);

function makeHash(items: Array<string>): ItemHash {
    return items.reduce((hash: ItemHash, item: string) => {
        hash[item] = true;
        return hash;
    }, {});
}

function getItemPriority(c: string): number {
    const isLowercase = /[a-z]/.test(c);
    const charCode = c.charCodeAt(0);

    return isLowercase ? charCode - 97 + 1 : charCode - 65 + 27;
}

function groupRucksacks(rucksacks: Array<string>): Array<[string, string, string]> {
    const result = [];
    const rucksackCount = rucksacks.length;
    let temp: Array<string> = [];
    for (let i = 0; i < rucksackCount; i += 1) {
        const rucksack = rucksacks[i];
        temp.push(rucksack);
        if (i % 3 === 2) {
            result.push(temp);
            temp = [];
        }
    }

    return result as Array<[string, string, string]>;
}

function getCommonItemInGroup(group: [string, string, string]): string | void {
    const [rucksack1, rucksack2, rucksack3] = group;
    const hash1 = makeHash(rucksack1.split(''));
    const hash2 = makeHash(rucksack2.split(''));
    const hash3 = makeHash(rucksack3.split(''));

    for (const item in hash1) {
        if (hash2[item] && hash3[item]) {
            return item;
        }
    }
}

export default function() {
    const rucksacks = input.split('\n');
    const groups = groupRucksacks(rucksacks);
    const commonItems = groups.map(getCommonItemInGroup).filter((item) => item) as Array<string>;
    const priorities = commonItems.map(getItemPriority)
    return sum(priorities);
}
import { monkeys } from './input';
import type { Monkey } from './types';

type ThrownItem = {
    targetId: number,
    item: bigint,
};

type MonkeyStatus = {
    [id: string]: {
        items: Array<bigint>,
        inspected: number
    }
};

function turn(monkey: Monkey): Array<ThrownItem> {
    const result: Array<ThrownItem> = [];
    console.log(`Monkey ${monkey.id}:`);

    while (monkey.items.length > 0) {
        let item = monkey.items.shift();
        if (!item) throw new Error(`Ran out of items (should never happen) for monkey ${monkey.id}`);

        console.log(`  Monkey inspects an item with a worry level of ${item}`);
        item = monkey.operation(item);
        console.log(`    Worry level is now ${item}`);
        item = item / 3n;
        console.log(`    Monkey gets bored with item. Worry level is divided by 3 to ${item}`);
        const targetId = monkey.test(item);
        console.log(`    Item with worry level ${item} is thrown to monkey ${targetId}`);
        result.push({ targetId: Number(targetId), item });
        monkey.inspected += 1;
    }

    return result;
}

function round(monkeys: Array<Monkey>) {
    for (const monkey of monkeys) {
        const thrown = turn(monkey);

        // transfer all thrown items to other monkeys
        for (const { targetId, item } of thrown) {
            monkeys[targetId].items.push(item);
        }
    }
}

function formatMonkeys(monkeys: Array<Monkey>): MonkeyStatus {
    
    const result: MonkeyStatus = {};
    for (const monkey of monkeys) {
        result[`Monkey ${monkey.id}`] = {
            items: monkey.items,
            inspected: monkey.inspected
        }
    }    
    return result;
}

function monkeyBusiness(monkeys: Array<Monkey>): number {
    const nuMonkeys = [...monkeys];
    nuMonkeys.sort((a, b) => b.inspected - a.inspected).slice(0, 2);
    return nuMonkeys[0].inspected * nuMonkeys[1].inspected;
}

export default function() {

    for (let r = 0; r < 20; r += 1) {
        round(monkeys);
    }    
    const monkeyStatus = formatMonkeys(monkeys);
    const monkeyBusinessLevel = monkeyBusiness(monkeys);
    return { monkeyStatus, monkeyBusinessLevel };
}
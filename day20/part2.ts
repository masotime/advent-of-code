import input from './input';

type Node = {
    value: number,
    position: number
};

type NumberList = Array<Node>;

const DECRYPTION_KEY = 811589153;

function parse(input: string): NumberList {
    const lines = input.split('\n');
    const result: NumberList = [];

    for (let i = 0; i < lines.length; i += 1) {
        const value = parseInt(lines[i], 10) * DECRYPTION_KEY;
        result.push({ value, position: i });
    }

    return result;
}

function visualize(list: NumberList): Array<number> {
    const result = new Array(list.length);

    for (const node of list) {
        result[node.position] = node.value;
    }

    return result;
}

function orderList(list: NumberList): Array<Node> {
    const result = new Array(list.length);

    for (const node of list) {
        result[node.position] = node;
    }

    return result;
}

function getRegularModulo(integer: number, modulo: number): number {
    const jsModulo = integer % modulo;
    const isNegativeJsModulo = jsModulo < 0;
    return isNegativeJsModulo ? (jsModulo + modulo) : jsModulo;
}

// the modulo in shuffling is... special. Due to the zero-based nature of arrays,
// we will treat a modulo result of 0 as being = length of the array.
function getShufflingModulo(integer: number, modulo: number): number {
    const jsModulo = integer % modulo;
    const isNegativeJsModulo = jsModulo < 0;
    const regularModulo = isNegativeJsModulo ? (jsModulo + modulo) : jsModulo;
    const shufflingModulo = regularModulo === 0 ? modulo : regularModulo;
    return shufflingModulo;
}

function simulatePass(list: NumberList): NumberList {
    const listLength = list.length;
    const orderedList = orderList(list);

    // Instead of modulo of the size of the list, the shuffling is actually done between
    // gaps of numbers. in a circular list, the number of gaps is
    // actually (length - 1).
    const mod = (integer: number) => getShufflingModulo(integer, listLength - 1);

    for (const node of list) {
        // zero case
        if (node.value === 0) {
            continue;
        }

        // consider each node. Don't actually move the nodes
        // in the list, but adjust node.position accordingly
        const nodeCurrent = node.position;
        const nodeNext = mod(nodeCurrent + node.value);

        if (nodeNext > nodeCurrent) {
            // if the direction is negative, then there is a "wraparound" effect
            // and the modulo position is inaccurate (as an array index). We have to
            // decrease it by 1

            // shuffle everything up to and including the destination node backwards
            for (let i = nodeCurrent + 1; i <= nodeNext; i += 1) {
                const sNode = orderedList[i];
                sNode.position -= 1;
                orderedList[sNode.position] = sNode;
            }
        } else {
            // shuffle everything strictly in between forwards. count backwards to avoid collision
            for (let i = nodeCurrent - 1; i >= nodeNext; i -= 1) {
                const sNode = orderedList[i];
                sNode.position += 1;
                orderedList[sNode.position] = sNode;
            }
        }

        // finally update position of node being moved
        node.position = nodeNext;
        orderedList[nodeNext] = node;

        // reconstruct the ordered List and visualize
        // const beforeNode = orderedList[getRegularModulo(node.position - 1, listLength)];
        // const afterNode = orderedList[getRegularModulo(node.position + 1, listLength)];
        // console.log(`${node.value} moves between ${beforeNode.value} and ${afterNode.value}:`);
        // console.log(`${visualize(list)}\n`);
    }

    return list;
}

function score(list: NumberList): number {
    const listLength = list.length;
    const orderedList = orderList(list);
    const mod = (integer: number) => getRegularModulo(integer, listLength);

    // find out where 0 is
    let zeroPosition = 0;
    for (const node of list) {
        if (node.value === 0) {
            zeroPosition = node.position;
            break;
        }
    }

    const oneThousandth = orderedList[mod(zeroPosition + 1000)].value;
    const twoThousandth = orderedList[mod(zeroPosition + 2000)].value;
    const threeThousandth = orderedList[mod(zeroPosition + 3000)].value;

    console.log({ oneThousandth, twoThousandth, threeThousandth });

    return oneThousandth + twoThousandth + threeThousandth;
}

export default function() {
    const list = parse(input);

    console.log(`Initial Arrangement:\n${visualize(list)}\n`);

    // do this ten times now
    for (let pass = 0; pass < 10; pass += 1) {
        simulatePass(list);
    }    

    const coordinates = score(list);
    
    return coordinates;
}
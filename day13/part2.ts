import input from './input';

type Packet = Array<number|Packet>;
type Pair = {
    left: Packet,
    right: Packet
};


function parseInput(input: string): Array<Packet> {
    const result: Array<Packet> = [];

    const pairLines = input.split('\n\n');
    for (const pairLine of pairLines) {
        const [line1, line2] = pairLine.split('\n');
        const pair: Pair = {
            left: JSON.parse(line1),
            right: JSON.parse(line2)
        };

        result.push(JSON.parse(line1));
        result.push(JSON.parse(line2));
    }

    return result;
}

function isRightOrder(pair: Pair): boolean | void {
    const { left, right } = pair;
    const comparisonLength = Math.max(left.length, right.length);

    for (let i = 0; i < comparisonLength; i += 1) {
        let leftVal = left[i];
        let rightVal = right[i];
        console.log('considering', leftVal, rightVal);

        if (leftVal === undefined) {
            return true; // left ran out of items
        } else if (rightVal === undefined) {
            return false; // right ran out of items
        }        

        if (!Array.isArray(leftVal) && !Array.isArray(rightVal)) {
            if (leftVal > rightVal) {
                return false;
            } else if (leftVal < rightVal) {
                return true;
            } else {
                continue;
            }
        }

        const psuedoPair = {
            left: Array.isArray(leftVal) ? leftVal : [leftVal],
            right: Array.isArray(rightVal) ? rightVal : [rightVal]
        };
        const valsInOrder = isRightOrder(psuedoPair);
        if (valsInOrder === false) {
            console.log(`${JSON.stringify(psuedoPair)} is not in order`);
            return false;
        } else if (valsInOrder === true) {
            return true;
        }
    }

    // indeterminate
    return undefined;
}

function sortFn(a: Packet, b: Packet) {
    const BGreaterA = isRightOrder({ left: a, right: b });
    const AGreaterB = isRightOrder({ left: b, right: a });

    if (BGreaterA === true) {
        return -1;
    } else if (AGreaterB === true) {
        return 1;
    } else {
        return 0;
    }
}

export default function() {
    const packets = parseInput(input);
    packets.push([[2]]);
    packets.push([[6]]);

    packets.sort(sortFn);
    const locOfDivider1 = packets.findIndex((val) => JSON.stringify(val) === '[[2]]') + 1;
    const locOfDivider2 = packets.findIndex((val) => JSON.stringify(val) === '[[6]]') + 1;
    console.log(packets);
    console.log(locOfDivider1, locOfDivider2);

    return { packets, solution: locOfDivider1 * locOfDivider2 };
}
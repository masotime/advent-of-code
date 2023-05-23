import input from './input';

type Packet = Array<number|Packet>;
type Pair = {
    left: Packet,
    right: Packet
};


function parseInput(input: string): Array<Pair> {
    const result: Array<Pair> = [];

    const pairLines = input.split('\n\n');
    for (const pairLine of pairLines) {
        const [line1, line2] = pairLine.split('\n');
        const pair: Pair = {
            left: JSON.parse(line1),
            right: JSON.parse(line2)
        };

        result.push(pair);
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

export default function() {
    const pairs = parseInput(input);
    const results = []
    let sum = 0;

    // console.log(isRightOrder(pairs[3]));

    for (let i = 0; i < pairs.length; i += 1) { 
        const pair = pairs[i]       
        const countThis = isRightOrder(pair);
        results.push({ id: `Pair ${i+1}`, pair, isRightOrder: isRightOrder(pair)});
        if (countThis) {
            sum += (i + 1);
        }
    }

    return { results, sum };
}
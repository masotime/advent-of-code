import input from './input';

type SnafuDigit = '=' | '-' | '0' | '1' | '2';
type Snafu = Array<SnafuDigit> // left to right, so most signficant digit at index 0
type FuelRequirements = Array<Snafu>

function parse(input: string): FuelRequirements {
    const requirements: FuelRequirements = [];

    const lines = input.split('\n');

    for (const line of lines) {
        requirements.push(line.split('') as Snafu);
    }

    return requirements;
}

const sToD: { [S in SnafuDigit]: number } = {
    '=': -2,
    '-': -1,
    '0': 0,
    '1': 1,
    '2': 2
};

const dToS: { [d in number]: SnafuDigit } = {
    '-2': '=',
    '-1': '-',
    0: '0',
    1: '1',
    2: '2'
};

function toDecimal(snafu: Snafu): number {
    let decimal = 0;
    let digitStrength = 1;
    const snafuCopy = [...snafu];

    while (snafuCopy.length > 0) {
        const sDigit = snafuCopy.pop()!;
        const digitValue = sToD[sDigit];
        decimal += digitValue * digitStrength;
        digitStrength *= 5;
    }

    return decimal;
}

function visualizeSnafu(snafus: FuelRequirements): string {
    let render = '';

    const pad = Math.max(...snafus.map(s => s.length)) + 2;

    render += `${'SNAFU'.padStart(pad)}  ${'Decimal'.padStart(pad)}\n`

    for (const snafu of snafus) {
        const decimal = toDecimal(snafu);
        render += `${snafu.join('').padStart(pad)}  ${decimal.toString().padStart(pad)}\n`
    }

    return render;
}

// mapping of the decimal values that can be represented by each individual
// snafu digit at a particular exponent.
// for example, -10 is represented by the snafu digit -2 at exponent 1
type SnafuDigitValues = Array<{
    value: number,
    snafuDigit: SnafuDigit,
    exponent: number    
}>;

function generateSnafuDigitValues(): SnafuDigitValues {
    // arbtirarily limit exponent to 21, because I just so happen to know -2 * 5^-22
    // is just above Number.MIN_SAFE_INTEGER
    const digitValues: SnafuDigitValues = [];

    for (let exponent = 0; exponent < 21; exponent += 1) {
        for (let digit = -2; digit <= 2; digit += 1) {
            // skip 0s which screw it up
            if (digit === 0) continue;

            const value = Math.pow(5, exponent) * digit;
            digitValues.push({
                value,
                snafuDigit: dToS[digit],
                exponent
            });
        }
    }

    // sort so that it's easier to use as a lookup
    digitValues.sort((a,b) => a.value-b.value);

    return digitValues;

}

type SnafuLimits = {
    [maxExponent: number]: {
        min: number,
        max: number
    }
};

function generateSnafuLimits(): SnafuLimits {
    const limits: SnafuLimits = {};
    let lowerLimit = 0;
    let upperLimit = 0;

    for (let exponent = 0; exponent < 21; exponent += 1) {
        lowerLimit += Math.pow(5, exponent) * -2;
        upperLimit += Math.pow(5, exponent) * 2;

        limits[exponent] = {
            min: lowerLimit,
            max: upperLimit,
        }
    }

    return limits;
}



function toSnafu(decimal: number, snafuDigitValues: SnafuDigitValues, snafuLimits: SnafuLimits): Snafu {
    let snafuMap: { [digit: number]: SnafuDigit } = {};
    let largestDigit = 0;

    // lookup the limits, which are sorted in ascending order
    // upon the first entry that is larger or equal than the current number
    // 1. compare possibilities - either the entry just greater than or equal to
    //    or the one before just less than
    // 2. choose an entry and set the snafuMap[exponent] = sanfuDigit - wehre
    //    exponent is the "digit position"
    // 3. remainder = remainder - entryValue
    // 4. repeat while the remainder is still not zero
    let remainder = decimal;
    do {
        // find first entry >= remainder
        const entryIdx = snafuDigitValues.findIndex(entry => entry.value >= remainder);
        const prevEntry = snafuDigitValues[entryIdx - 1];
        const currEntry = snafuDigitValues[entryIdx];

        if (!currEntry) {
            throw new Error(`No entry found for ${decimal}`);
        }

        // we now have to choose either
        // * the entry (just greater or equal) or
        // * the previous entry (less than or equal).
        //
        // we cannot choose the current entry if the resulting remainder
        // is not representable within the limits of a number with
        // (currEntry.exponent - 1) digits left.
        //
        // e.g. for 6, I can't choose snafu "20" = decimal 10 because the remainder
        // is 4. 10 needs 2 digits [2x] and I can't represent 4 with 1 snafu digit [x].
        // I can choose decimal 5 (snafu "10") though, because I can represent
        // the remainder 1 with [x]
        const currDifference = Math.abs(remainder - currEntry.value);
        const limitsForNextDigit = snafuLimits[currEntry.exponent - 1];

        // things get a bit tricky with exponent 0. Obviously there's no sanfu limits lookup (0-1 = -1),
        // but if the difference is 0 after subtracting currEntry we can just stop and use it since that's
        // our solution, otherwise we have to fallback to prevEntry. Probably some more elegant way to
        // handle it, but I don't have the patience to figure it out 😅
        const limitsFit = (limitsForNextDigit && currDifference <= limitsForNextDigit.max && currDifference >= limitsForNextDigit.min);
        const entry = (currDifference === 0 || limitsFit) ? currEntry : prevEntry;

        snafuMap[entry.exponent] = entry.snafuDigit;
        remainder -= entry.value;
        largestDigit = Math.max(largestDigit, entry.exponent);
    } while (remainder !== 0);

    // we now have to convert the map into a Snafu array
    // where the largest digit is in front
    const snafu: Snafu = []
    for (let i = largestDigit; i >= 0; i -= 1) {
        snafu.push(snafuMap[i] || '0');
    }    

    return snafu;
}

export default function() {
    const fuelRequirements = parse(input);    

    console.log(visualizeSnafu(fuelRequirements));
    const snafuDigitValues = generateSnafuDigitValues();
    const snafuLimits = generateSnafuLimits();
    console.table(snafuDigitValues);
    console.table(snafuLimits);

    const decimalsToTest = [1,2,3,4,5,6,7,8,9,10,15,20,2022,12345,314159265];
    const snafusToValidate = decimalsToTest.map(decimal => toSnafu(decimal, snafuDigitValues, snafuLimits));

    console.log(visualizeSnafu(snafusToValidate));

    const decimalSum = fuelRequirements.map(snafu => toDecimal(snafu)).reduce((decimalSum, decimalValue) => {
        decimalSum += decimalValue;
        return decimalSum;
    }, 0);

    const snafuSum = toSnafu(decimalSum, snafuDigitValues, snafuLimits).join('');

    return { fuelRequirements: fuelRequirements.map(sanfu => sanfu.join('')), decimalSum, snafuSum };
}
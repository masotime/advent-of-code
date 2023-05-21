import input from './input';

type DetectorMap = {
    [char: string]: number
};

const DISTINCT_COUNT = 14;

function detectStart(buffer: string) {
    const detectorMap: DetectorMap = {};
    let lastIndex = 0;
    
    while (Object.keys(detectorMap).length < DISTINCT_COUNT && lastIndex < buffer.length) {
        const currentChar = buffer[lastIndex];
        if (lastIndex > DISTINCT_COUNT - 1) {
            // remove the key at lastIndex - DISTINCT_COUNT
            const charToRemove = buffer[lastIndex - DISTINCT_COUNT];
            detectorMap[charToRemove] -= 1;
            if (detectorMap[charToRemove] === 0) {
                delete detectorMap[charToRemove];
            }
        }
        detectorMap[currentChar] = (detectorMap[currentChar] || 0) + 1;
        lastIndex += 1;
    }

    return lastIndex;
}

export default function() {
    const buffers = input.split('\n');
    const results: {[buffer: string]: number} = {};
    
    for (const buffer of buffers) {
        results[buffer] = detectStart(buffer);
    }
    return results;
}
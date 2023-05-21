/*
### Context
The Elves take turns writing down the number of Calories contained by the various meals, snacks, rations, etc.
that they've brought with them, one item per line. Each Elf separates their own inventory from the previous Elf's
inventory (if any) by a blank line.

### Question
Find the Elf carrying the most Calories. How many total Calories is that Elf carrying?
*/

import input from './input';

export default () => {
    const elves = input.split('\n\n');
    const foodsums = elves.map(rawData => {
        const lines = rawData.split('\n').map(str => parseInt(str, 10));
        return lines.reduce((sum, food) => {
            return food + sum;
        }, 0)
    })
    
    const largest = foodsums.sort((a,b) => a-b).reverse()[0];

    return largest;
}

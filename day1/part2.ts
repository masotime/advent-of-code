/*
### Context
The Elves would instead like to know the total Calories carried by the top three Elves carrying the most Calories.
That way, even if one of those Elves runs out of snacks, they still have two backups.

### Question
Find the top three Elves carrying the most Calories. How many Calories are those Elves carrying in total?
*/

import input from './input';

const sum = (arr: Array<number>) => arr.reduce((sum, num) => {
    return sum + num;
}, 0);

export default () => {
    const elves = input.split('\n\n');
    const foodsums = elves.map(rawData => {
        const lines = rawData.split('\n').map(str => parseInt(str, 10));
        return sum(lines);
    })
    
    const top3 = foodsums.sort((a,b) => a-b).reverse().slice(0, 3);
    const top3Sum = sum(top3);

    return top3Sum;
}

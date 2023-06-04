// just to verify the parsing works
import type { Blueprint, Robot } from './part1';

export function renderBlueprints(blueprints: Array<Blueprint>): string {
    let result = '';
    for (let i = 0; i < blueprints.length; i += 1) {
        const blueprint = blueprints[i];
        result += `Blueprint ${i+1}: `;
        const sentences = [];
        for (const robot in blueprint) {
            const mineralData = blueprint[robot as Robot];
            let sentence = '';
            
            sentence += `Each ${robot} robot costs `;
            const mineralsNeeded = [];
            mineralData.ore > 0 && mineralsNeeded.push(`${mineralData.ore} ore`);
            mineralData.clay > 0 && mineralsNeeded.push(`${mineralData.clay} clay`);
            mineralData.obsidian > 0 && mineralsNeeded.push(`${mineralData.obsidian} obsidian`);
            sentence += mineralsNeeded.join(' and ') + '.';
            sentences.push(sentence);
        }
        result += sentences.join(' ') + '\n';
    }
    return result;
}
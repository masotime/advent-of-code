import input from './input';

type Mineral = 'ore' | 'clay' | 'obsidian';
export type Robot = 'ore' | 'clay' | 'obsidian' | 'geode';
export type Blueprint = {
    [r in Robot]: {
        [o in Mineral]: number
    }
};

type RobotManifest = {
    [r in Robot]: number
};

type MineralManifest = {
    [m in Mineral]: number
};

// no chatgpt, used regexr.com to help me here.
const robotLineRegex = /Each ([^\s]+) robot costs (([\d]+) ore)?( and )?(([\d]+) clay)?( and )?(([\d]+) obsidian)?/;
function parse(input: string): Array<Blueprint> {
    const lines = input.split('\n');
    const blueprints: Array<Blueprint> = [];
    

    for (const line of lines) {
        // break it up
        const details = line.split(':')[1].trim();
        
        const robotLines = details.split('.').map(_ => _.trim())
        robotLines.splice(-1); // the '' after the last '.' needs to be sliced off
        const blueprint: Blueprint = {} as Blueprint;

        // Extract per robot
        for (const robotLine of robotLines) {
            const parts = robotLine.match(robotLineRegex);

            if (parts === null) {
                throw new Error(`Failed to parse ${robotLine} with regex!`);
            }

            const robot: Robot = parts[1] as Robot;
            const oreNeeded: number = parseInt(parts[3] ?? 0, 10);
            const clayNeeded: number = parseInt(parts[6] ?? 0, 10);
            const obsidianNeeded: number = parseInt(parts[9] ?? 0, 10);

            blueprint[robot] = {
                ore: oreNeeded,
                clay: clayNeeded,
                obsidian: obsidianNeeded
            };
        }

        blueprints.push(blueprint);
    }

    return blueprints;
}

interface RobotConstruction {
    robotToBuild: Robot | void,
    mineralsSpent: {
        [m in Mineral]: number
    }
}

interface MineralCollection {
    mineralsCollected: {
        [m in Mineral]: number
    },
}

type Phase = RobotConstruction & MineralCollection;

type Simulation = {
    phases: Array<Phase>,
    timeRemaining: number,
    geodesOpen: number,
    minerals: MineralManifest,
    robots: RobotManifest
};

function generateConstructionOptions(minerals: MineralManifest, blueprint: Blueprint): Array<RobotConstruction> {
    const constructionOptions: Array<RobotConstruction> = [];    

    const { ore, clay, obsidian, geode } = blueprint;
    const robotsToConsider = [ore, clay, obsidian, geode];

    for (const robotOption in blueprint) {
        const requirements = blueprint[robotOption as Robot]
        if (requirements.ore <= minerals.ore &&
            requirements.clay <= minerals.clay &&
            requirements.obsidian <= minerals.obsidian
        ) {
            constructionOptions.push({
                robotToBuild: robotOption as Robot,
                mineralsSpent: { ...requirements }
            })
        }
    }

    return constructionOptions;
}

const generateEmptyPhase = (): Phase => ({
    robotToBuild: undefined,
    mineralsSpent: {
        ore: 0,
        clay: 0,
        obsidian: 0
    },
    mineralsCollected: {
        ore: 0,
        clay: 0,
        obsidian: 0
    }
});

type State = {
    geodesOpen: number,
    minerals: MineralManifest
};

function pruneCandidates(solutions: Array<Simulation>) {
    // sort the candidates in descending order of "priority scores"
    // timeRemaining, geodesOpen, robots (geode to ore) then minerals (obsidian to ore)
    //
    // once sorted, count backwards. If the current candidate is strictly better
    // than the next candidate, prune that candidate

    solutions.sort((sim1, sim2) => {
        if (sim1.timeRemaining !== sim2.timeRemaining) {
            return sim2.timeRemaining - sim1.timeRemaining;
        } else if (sim1.geodesOpen !== sim2.geodesOpen) {
            return sim2.geodesOpen - sim1.geodesOpen;
        } else if (sim1.robots.geode !== sim2.robots.geode) {
            return sim2.robots.geode - sim1.robots.geode;
        } else if (sim1.robots.obsidian !== sim2.robots.obsidian) {
            return sim2.robots.obsidian - sim1.robots.obsidian;
        } else if (sim1.robots.clay !== sim2.robots.clay) {
            return sim2.robots.clay - sim1.robots.clay;
        } else if (sim1.robots.ore !== sim2.robots.ore) {
            return sim2.robots.ore - sim1.robots.ore;
        } else if (sim1.minerals.obsidian !== sim2.minerals.obsidian) {
            return sim2.minerals.obsidian - sim1.minerals.obsidian;
        } else if (sim1.minerals.clay !== sim2.minerals.clay) {
            return sim2.minerals.clay - sim1.minerals.clay;
        } else {
            return sim2.minerals.ore - sim1.minerals.ore;
        }
    });

    function strictlyBetter(current: Simulation, next: Simulation): boolean {
        const atLeastAsGoodAs = (current.timeRemaining >= next.timeRemaining &&
            current.geodesOpen >= next.geodesOpen &&
            current.robots.geode >= next.robots.geode &&
            current.robots.obsidian >= next.robots.obsidian &&
            current.robots.clay >= next.robots.clay &&
            current.robots.ore >= next.robots.ore &&
            current.minerals.obsidian >= next.minerals.obsidian &&
            current.minerals.clay >= next.minerals.clay &&
            current.minerals.ore >= next.minerals.ore);
        const betterInOneWay = (current.timeRemaining > next.timeRemaining ||
            current.geodesOpen > next.geodesOpen ||
            current.robots.geode > next.robots.geode ||
            current.robots.obsidian > next.robots.obsidian ||
            current.robots.clay > next.robots.clay ||
            current.robots.ore > next.robots.ore ||
            current.minerals.obsidian > next.minerals.obsidian ||
            current.minerals.clay > next.minerals.clay ||
            current.minerals.ore > next.minerals.ore);

        return atLeastAsGoodAs && betterInOneWay;
    }

    // note: we need to count backwards since we are mutating the array
    for (let i = solutions.length - 2; i >= 0; i -= 1) {
        const current = solutions[i];
        const next = solutions[i+1];
        if (strictlyBetter(current, next)) {
            solutions.splice(i + 1,1);
        }
    }

    // finally we just trim the solutions (who knows what the best f***ing heuristic is)
    const TRIM_LEVEL = 5000;
    solutions.splice(TRIM_LEVEL, solutions.length - TRIM_LEVEL);
}

// solves for one blueprint
function solve(initialRobots: RobotManifest, blueprint: Blueprint, timeLimit: number): Array<Simulation> {

    const simulationStart: Simulation = {
        phases: [],
        timeRemaining: timeLimit,
        geodesOpen: 0,
        minerals: {
            ore: 0,
            clay: 0,
            obsidian: 0
        },
        robots: { ...initialRobots }
    };

    const simulations = [simulationStart];
    const solutions: Array<Simulation> = [];

    while (simulations.length > 0) {
        const simulation = simulations.shift() as Simulation;
        const { timeRemaining, phases, geodesOpen, minerals, robots } = simulation;

        if (simulation.timeRemaining === 0) {
            // simulation ended, nothing to do
            solutions.push(simulation);
            continue;
        }

        // now for each phase, consider and populate candidates
        const candidates: Array<Simulation> = [];

        // Phase 1: Spend minerals on a robot, if possible.
        const constructionOptions = generateConstructionOptions(simulation.minerals, blueprint);
        for (const option of constructionOptions) {
            const phase: Phase = {
                robotToBuild: option.robotToBuild,
                mineralsSpent: option.mineralsSpent,
                mineralsCollected: {
                    ore: 0,
                    clay: 0,
                    obsidian: 0
                }
            }
            const candidate = {                
                phases: [...phases, phase],
                timeRemaining,
                geodesOpen,
                minerals: {
                    ore: minerals.ore - option.mineralsSpent.ore,
                    clay: minerals.clay - option.mineralsSpent.clay,
                    obsidian: minerals.obsidian - option.mineralsSpent.obsidian
                },
                robots: { ...robots }
            };
            candidates.push(candidate);
        }

        // push a "null" candidate where nothing is built
        candidates.push({
            phases: [...phases, generateEmptyPhase()],
            timeRemaining,
            geodesOpen,
            minerals: { ...minerals },
            robots: { ...robots }
        })
        

        // Phase 2: Collect minerals using existing robots across all candidates
        // Phase 2a: Also open geodes
        for (const candidate of candidates) {
            const { robots, minerals } = candidate;
            minerals.ore += robots.ore;
            minerals.clay += robots.clay;
            minerals.obsidian += robots.obsidian;
            candidate.geodesOpen += robots.geode;
        }

        // Phase 3: Complete construction on robots. We do this after phase 2 since we
        // don't include the robot in the mining of minerals
        for (const candidate of candidates) {
            const lastPhase = candidate.phases[candidate.phases.length - 1];
            if (lastPhase.robotToBuild) {
                candidate.robots[lastPhase.robotToBuild] += 1;
            }
        }

        // Phase 4: Advance time on each candidate
        candidates.forEach(candidate => {
            candidate.timeRemaining -= 1;
        });

        simulations.push(...candidates);
        // console.log('----------------------------- BEFORE PRUNE ------------------------------');
        // console.log(simulations.length, simulations);
        // console.log('----------------------------- AFTER PRUNE ------------------------------');
        pruneCandidates(simulations);
        // console.log(simulations.length, simulations);
        // console.log('----------------------------- CONTINUE? ------------------------------');
        // simulations.length % 500 === 0 && console.log('solution space size ', simulations.length, 'candidate time left', simulation.timeRemaining);
    }

    return solutions;
}


export default function() {
    const blueprints = parse(input);
    const timeLimit = 32;
    const initialRobots = {
        ore: 1,
        clay: 0,
        obsidian: 0,
        geode: 0
    };
    
    let runningProduct = 1;
    for (let i = 0; i < 3; i += 1) {
        const blueprintId = i + 1;
        const solutions = solve(initialRobots, blueprints[i], timeLimit);
        const highestGeodes = solutions[0].geodesOpen;
        runningProduct *= highestGeodes;
        console.log(`For blueprint id ${blueprintId}, geodes = ${highestGeodes}`);        
    }
    
    return { runningProduct };
}
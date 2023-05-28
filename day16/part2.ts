import input from './input';

type Valve = {
    name: string,
    flowRate: number,
    connections: Array<string>
};

type ValveMapping = {
    [name: string]: Valve
}; 
type Volcano = {
    valves: ValveMapping,
    start: string,
    maxFlow: number
};

type Distances = {
    [name: string]: {
        [name: string]: number
    }
};

const CHATGPT_REGEX = /Valve\s(\w+)\shas\sflow\ rate=(\d+);\stunnels?\sleads?\sto\svalves?\s(.*)/;

function parseInput(input: string): Volcano {
    const volcano = {
        start: 'AA',
        valves: {} as ValveMapping,
        maxFlow: 0
    };

    const lines = input.split('\n');

    for (const line of lines) {
        const match = line.match(CHATGPT_REGEX);

        if (match) {
          const name = match[1];
          const flowRate = parseInt(match[2]);
          const connections = match[3].split(',').map(valve => valve.trim());

          volcano.valves[name] = {
            name,
            flowRate,
            connections
          };
          volcano.maxFlow += flowRate;
        
        }
    }

    return volcano;
}

function constructDistances(volcano: Volcano): Distances {
    const distances: Distances = {};

    // simplified path
    type Trace = {
        valve: string,
        distance: number
    };

    // iterate through each valve. For each valve, perform a BFS search,
    // incrementing the distance each time. Track explored valves
    for (const valve in volcano.valves) {
        const explored: { [valve: string]: boolean } = { [valve]: true };
        const fronts: Array<Trace> = [{valve, distance: 0}];
        distances[valve] ??= {};
        distances[valve][valve] = 0;

        while (fronts.length > 0) {
            const trace = fronts.shift() as Trace;
            const options = volcano.valves[trace.valve].connections;
            for (const connectedValve of options) {
                if (!explored[connectedValve]) {
                    fronts.push({ valve: connectedValve, distance: trace.distance + 1 });
                    distances[valve] ??= {};
                    distances[valve][connectedValve] = trace.distance + 1;
                    explored[connectedValve] = true;
                }
            }
        }
    }

    return distances;

}

type Step = {
    id: string, // valve located at        

    // derived values
    timeRemaining: number,
    flowRate: number,
}

type Path = {
    steps: Array<Step>,

    // derived globals
    totalPressureReleased: number,
    unvisited: Array<string>,
    finalTotal?: number
};

type Solution = {
    steps: Array<Step>,
    totalPressureReleased: number
};

type SolutionLookup = {
    steps: Array<string>,
    score: number
};

function closeSoloPath(path: Path): Path {
    const { flowRate, timeRemaining } = path.steps[path.steps.length - 1];
    path.finalTotal = path.totalPressureReleased + flowRate * timeRemaining;
    return path;
}

type GeneratorInput = {
    volcano: Volcano,
    distances: Distances,
    valveLimit: number,
    initialTimeRemaining: number
};

type GeneratedSolution = {
    solutions: Array<SolutionLookup>,
    maxValves: number
};

function viableValves(volcano: Volcano): Array<Valve> {
    return Object.values(volcano.valves).filter(valve => valve.flowRate !== 0);
}

function generateSolutions({ volcano, distances, valveLimit, initialTimeRemaining }: GeneratorInput): GeneratedSolution {
    const viableOptions: Array<Valve> = viableValves(volcano);
    let solutions: Array<Solution> = [];
    let maxValves: number = Number.MIN_SAFE_INTEGER;

    const initialPath: Path = {
        steps: [{ id: volcano.start, timeRemaining: initialTimeRemaining, flowRate: 0 }],
        totalPressureReleased: 0,
        unvisited: viableOptions.map(valve => valve.name)
    }
    const searchSpace: Array<Path> = [initialPath];

    while (searchSpace.length > 0) {
        const path = searchSpace.shift() as Path; // dequeue
        const lastPosition = path.steps[path.steps.length - 1];
        let candidatePathsGenerated = false;

        if (path.steps.length === valveLimit + 1) { // opened max number of valves, we need to close the path. +1 to skip initial step
            const steps = closeSoloPath(path).steps;
            solutions.push({ steps, totalPressureReleased: path.finalTotal as number });
            maxValves = Math.max(maxValves, steps.length - 1);
            continue; // don't try to add more candidates
        }

        for (const candidateValve of path.unvisited) {
            // simulate "teleporting" to that valve and opening it
            const timeItWouldTake = distances[lastPosition.id][candidateValve] + 1 // +1 to open it

            // HEURISTIC: only continue consideration if the time remaining exceeds the time it would take to get
            // to that valve and open it
            if (lastPosition.timeRemaining > timeItWouldTake) {
                const timeRemaining = lastPosition.timeRemaining - timeItWouldTake;
                const flowRate = lastPosition.flowRate + volcano.valves[candidateValve].flowRate;

                const totalPressureReleased = path.totalPressureReleased + lastPosition.flowRate * timeItWouldTake;
                const unvisited = [...path.unvisited];
    
                unvisited.splice(unvisited.indexOf(candidateValve), 1);
    
                const nextStep = {
                    id: candidateValve,
                    timeRemaining,
                    flowRate
                };
    
                searchSpace.push({
                    steps: [...path.steps, nextStep],
    
                    totalPressureReleased,
                    unvisited
                });

                candidatePathsGenerated = true;
            }
        }

        if (!candidatePathsGenerated) {
            // this path is effectively a solution, no other paths are spawned from it
            const steps = closeSoloPath(path).steps;
            solutions.push({ steps, totalPressureReleased: path.finalTotal as number });
            maxValves = Math.max(maxValves, steps.length - 1);
        }
    }

    // finally we sort the solutions in order of descending totals
    solutions.sort((a,b) => b.totalPressureReleased - a.totalPressureReleased);

    // and transform into a format that's easier for lookup in the actual solution
    const solutionLookup = solutions.map(({ steps, totalPressureReleased }) => ({
        steps: steps.slice(1).map(_ => _.id), // slice(1) to remove initial step
        score: totalPressureReleased
    }));

    return { solutions: solutionLookup, maxValves };
}


export default function() {
    const volcano = parseInput(input);   
    const timeLimit = 26;
    const distances = constructDistances(volcano);

    const solutionMap: { [S in number]: Array<SolutionLookup> } = {};
    let maxValves = Number.MIN_SAFE_INTEGER;
    
    console.table(distances);
    
    for (let v = viableValves(volcano).length; v > 0; v -= 1) {        
        const { solutions, maxValves: maxValvesFound } = generateSolutions({ volcano, distances, valveLimit: v, initialTimeRemaining: timeLimit });

        maxValves = Math.max(maxValves, maxValvesFound - 1); // -1 due to initial step
        if (v > maxValves) { 
            v = maxValves;
        }

        solutionMap[v] = solutions;

        console.log(`Solutions for valveLimit ${v} (truncated to top 100)`);
        console.table(solutionMap[v].map(({ steps, score}) => ({steps: steps.join(','), score })).slice(0,100));
    }

    let highestScore = Number.MIN_SAFE_INTEGER;
    let highestCombination: { yourSteps: Array<string>, elephantSteps: Array<string> } | void = undefined;

    // STRATEGY: for each "first" (s1) step array, find a corresponding non-intersecting step array (s2) that gives a high(er) score
    // REASONING: Find a pair of paths for you and your elephant which both have optimal scores (already sorted in reverse score
    // from the "generateSolutions" function above).
    // NOTE: We can't just assume the highest score for one will also lead to the highest score for 2 - some other combination of non-highest
    // scores could be higher when added together
    for (let pathLength = maxValves; pathLength > 0; pathLength -= 1) {

        const solutionSpace = solutionMap[pathLength].length;

        for (let s1 = 0; s1 < solutionSpace; s1 += 1) {
            const { steps: yourSteps, score: yourScore } = solutionMap[pathLength][s1];        
            for (let s2 = s1 + 1; s2 < solutionSpace; s2 += 1) {
                const { steps: elephantSteps, score: elephantScore} = solutionMap[pathLength][s2];
                if (yourSteps.find(step => elephantSteps.includes(step)) !== undefined) {
                    continue;
                }

                if (highestScore > yourScore + elephantScore) {
                    break; // no point searching more, rest of elephantScores will be lower since array is sorted in descending score
                }

                // found a pair
                highestScore = yourScore + elephantScore;
                highestCombination = { yourSteps, elephantSteps };
                console.log({ highestScore, highestCombination });
            }
        }
    }

    return { highestScore, highestCombination };
}
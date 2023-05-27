import input from './sample';

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

// PT 2: The "path" is now a duality with 2 steps running in parallel
type Path = {
    yourSteps: Array<Step>,
    elephantSteps: Array<Step>,

    // derived globals
    totalPressureReleased: number,

    // PT2: Note that the "unvisited" is now a shared array between yourself and the elephant
    unvisited: Array<string>,
    finalTotal?: number
}

// PT 2: this is now 30-4 = 26 per part 2 description
const INITIAL_TIME_REMAINING = 30;

function closePath(path: Path): Path {
    const { flowRate, timeRemaining } = path.yourSteps[path.yourSteps.length - 1];
    path.finalTotal = path.totalPressureReleased + flowRate * timeRemaining;

    // PT 2: include the elephant in the calculations
    const { flowRate: elephantFlowRate, timeRemaining: elephantTimeRemaining } = path.elephantSteps[path.elephantSteps.length - 1];
    path.finalTotal += elephantFlowRate * elephantTimeRemaining;

    return path;
}

// Brute force search
function solve(volcano: Volcano, distances: Distances): Array<Path> {

    // only consider valves that can be opened
    const viableOptions: Array<Valve> = Object.values(volcano.valves).filter(valve => valve.flowRate !== 0);
    console.log(`Maximum search space size = ${viableOptions.length}!`);

    // BFS like sweep, potentially improvable by pruning
    const initialPath: Path = {
        yourSteps: [{ id: volcano.start, timeRemaining: INITIAL_TIME_REMAINING, flowRate: 0 }],
        elephantSteps: [{ id: volcano.start, timeRemaining: INITIAL_TIME_REMAINING, flowRate: 0 }],

        totalPressureReleased: 0,
        unvisited: viableOptions.map(valve => valve.name)
    }

    const searchSpace: Array<Path> = [initialPath];
    let solution: Path = initialPath;

    while (searchSpace.length > 0) {
        const path = searchSpace.shift() as Path; // dequeue
        const yourLastPosition = path.yourSteps[path.yourSteps.length - 1];
        const elephantLastPosition = path.elephantSteps[path.elephantSteps.length - 1];

        let candidatePathsGenerated = false;

        for (let u1 = 0; u1 < path.unvisited.length; u1 += 1) {
            // let candidatePath: Path = {
            //     yourSteps: [...path.yourSteps],
            //     elephantSteps: [...path.elephantSteps],

            //     totalPressureReleased: path.totalPressureReleased,
            //     unvisited: [...path.unvisited]
            // };

            // track step permutations
            let yourNextStep: Step | void = undefined;            

            // simulate you "teleporting" to that valve and opening it
            const yourNextValve = path.unvisited[u1];
            const yourTimeElapsed = distances[yourLastPosition.id][yourNextValve] + 1 // +1 to open it

            // only continue consideration if the time remaining exceeds the time elapsed
            if (yourLastPosition.timeRemaining > yourTimeElapsed) {
                const yourNextTimeRemaining = yourLastPosition.timeRemaining - yourTimeElapsed;
                const yourNextFlowRate = yourLastPosition.flowRate + volcano.valves[yourNextValve].flowRate;

                // remove your valve from consideration of the elephant's choices
                // valvesChosen.push(yourNextValve);

                yourNextStep = {
                    id: yourNextValve,
                    timeRemaining: yourNextTimeRemaining,
                    flowRate: yourNextFlowRate
                };

                // TODO: Since the choice order doesn't matter - i.e. you choosing or the elephant choosing first
                // it should be possible to slice and take all path after the index u1 instead of just removing u1.
                // candidatePath.unvisited.splice(candidatePath.unvisited.indexOf(yourNextValve), 1);
                // candidatePath.yourSteps.push(nextStep);
                // candidatePath.totalPressureReleased += yourLastPosition.flowRate * yourTimeElapsed;
            }

            // If you have a next step, we push a candidate path with you moving but not the elephant
            if (yourNextStep) {
                const candidatePath: Path = {
                    yourSteps: [...path.yourSteps],
                    elephantSteps: [...path.elephantSteps],

                    totalPressureReleased: path.totalPressureReleased,
                    unvisited: [...path.unvisited]
                }

                candidatePath.yourSteps.push(yourNextStep);
                candidatePath.totalPressureReleased += yourLastPosition.flowRate * (yourLastPosition.timeRemaining - yourNextStep.timeRemaining);
                candidatePath.unvisited = candidatePath.unvisited.splice(candidatePath.unvisited.indexOf(yourNextStep.id), 1);

                searchSpace.push(candidatePath);
                candidatePathsGenerated = true;
            }

            // START: Code for the elephant - inner loop on the remaining unvisited valves (in case you picked one earlier)
            const elephantCandidates = [...path.unvisited];
            if (yourNextStep) {
                elephantCandidates.splice(elephantCandidates.indexOf(yourNextStep.id), 1);
            }
            
            for (let u2 = 0; u2 < elephantCandidates.length; u2 += 1) {
                // COPYPASTA REGION
                // simulate elephant "teleporting" to that valve and opening it
                const elephantNextValve = elephantCandidates[u2];
                const elephantTimeElapsed = distances[elephantLastPosition.id][elephantNextValve] + 1 // +1 to open it

                // only continue consideration if the time remaining exceeds the time elapsed
                if (elephantLastPosition.timeRemaining > elephantTimeElapsed) {
                    // we generate a new path for each of the elephant's candidates
                    const elephantNextTimeRemaining = elephantLastPosition.timeRemaining - elephantTimeElapsed;
                    const elephantNextFlowRate = elephantLastPosition.flowRate + volcano.valves[elephantNextValve].flowRate;

                    // remove elephant's valve from consideration of unvisited paths
                    // TODO: Since the choice order doesn't matter - i.e. you choosing or the elephant choosing first
                    // it should be possible to slice and take all path after the index u1 instead of just removing u1.
                    // candidatePath.unvisited.splice(candidatePath.unvisited.indexOf(elephantNextValve), 1);

                    const elephantNextStep = {
                        id: elephantNextValve,
                        timeRemaining: elephantNextTimeRemaining,
                        flowRate: elephantNextFlowRate
                    };

                    // generate a candidate path
                    const candidatePath: Path = {
                        yourSteps: [...path.yourSteps],
                        elephantSteps: [...path.elephantSteps],

                        totalPressureReleased: path.totalPressureReleased,
                        unvisited: [...path.unvisited]
                    }

                    // update each field accordingly with all the accumulated values
                    if (yourNextStep) {
                        candidatePath.yourSteps.push(yourNextStep);
                        candidatePath.totalPressureReleased += yourLastPosition.flowRate * (yourLastPosition.timeRemaining - yourNextStep.timeRemaining);
                        candidatePath.unvisited = candidatePath.unvisited.splice(candidatePath.unvisited.indexOf(yourNextStep.id), 1);
                    }

                    candidatePath.elephantSteps.push(elephantNextStep);
                    candidatePath.totalPressureReleased += elephantLastPosition.flowRate * (elephantLastPosition.timeRemaining - elephantNextStep.timeRemaining);
                    candidatePath.unvisited = candidatePath.unvisited.splice(candidatePath.unvisited.indexOf(elephantNextStep.id), 1);

                    searchSpace.push(candidatePath);
                    candidatePathsGenerated = true;
                }
            }

            // END: Code for the elephant - inner loop on the remaining unvisited valves (in case you picked one earlier)
        }

        if (!candidatePathsGenerated) {
            // we are at a possible solution in such a state
            const candidateSolution = closePath(path);

            if ((candidateSolution.finalTotal ?? 0) > (solution.finalTotal ?? 0)) {
                solution = candidateSolution;
            }
        }


        (searchSpace.length % 1000 === 0) && console.log(`Search Space is now of size ${searchSpace.length}`);
    }

    return [solution];
}

export default function() {
    const volcano = parseInput(input);    

    const distances = constructDistances(volcano);
    console.table(distances);

    const solutions = solve(volcano, distances);
    solutions.sort((path1, path2) => (path2.finalTotal ?? 0) - (path1.finalTotal ?? 0)); // reverse sort
    console.log(solutions[0]);

    return volcano;
}
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

// PT 2: The "path" is now a duality with 2 steps running in parallel
type Path = {
    yourSteps: Array<{
        id: string, // valve located at        

        // derived values
        timeRemaining: number,
        flowRate: number,
        
    }>,

    elephantSteps: Array<{
        id: string, // valve located at

        // derived values
        timeRemaining: number,
        flowRate: number,

    }>,

    // derived globals
    totalPressureReleased: number,

    // PT2: Note that the "unvisited" is now a shared array between yourself and the elephant
    unvisited: Array<string>,
    finalTotal?: number
}

// PT 2: this is now 30-4 = 26 per part 2 description
const INITIAL_TIME_REMAINING = 30;

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
    const solutions: Array<Path> = [];

    function closePath(path: Path): Path {
        const { flowRate, timeRemaining } = path.yourSteps[path.yourSteps.length - 1];
        path.finalTotal = path.totalPressureReleased + flowRate * timeRemaining;

        // PT 2: include the elephant in the calculations
        const { flowRate: elephantFlowRate, timeRemaining: elephantTimeRemaining } = path.elephantSteps[path.elephantSteps.length - 1];
        path.finalTotal += elephantFlowRate * elephantTimeRemaining;

        return path;
    }

    while (searchSpace.length > 0) {
        const path = searchSpace.shift() as Path; // dequeue
        const yourLastPosition = path.yourSteps[path.yourSteps.length - 1];

        if (path.unvisited.length === 0) {
            solutions.push(closePath(path));
            continue;
        }

        let candidatePathsGenerated = false;

        for (let u1 = 0; u1 < path.unvisited.length; u1 += 1) {
            let candidatePath: Path = {
                yourSteps: [...path.yourSteps],
                elephantSteps: [...path.elephantSteps],

                totalPressureReleased: path.totalPressureReleased,
                unvisited: [...path.unvisited]
            };

            // we consider you and the elephant separately
            let someoneChoseAValve = false;

            // simulate you "teleporting" to that valve and opening it
            const yourNextValve = path.unvisited[u1];
            const yourTimeElapsed = distances[yourLastPosition.id][yourNextValve] + 1 // +1 to open it

            // only continue consideration if the time remaining exceeds the time elapsed
            if (yourLastPosition.timeRemaining > yourTimeElapsed) {
                const yourNextTmeRemaining = yourLastPosition.timeRemaining - yourTimeElapsed;
                const yourNextFlowRate = yourLastPosition.flowRate + volcano.valves[yourNextValve].flowRate;

                // remove your valve from consideration of the elephant's choices
                // TODO: Since the choice order doesn't matter - i.e. you choosing or the elephant choosing first
                // it should be possible to slice and take all path after the index u1 instead of just removing u1.
                candidatePath.unvisited.splice(candidatePath.unvisited.indexOf(yourNextValve), 1);

                const nextStep = {
                    id: yourNextValve,
                    timeRemaining: yourNextTmeRemaining,
                    flowRate: yourNextFlowRate
                };

                candidatePath.yourSteps.push(nextStep);
                candidatePath.totalPressureReleased += yourLastPosition.flowRate * yourTimeElapsed;

                someoneChoseAValve = true;
            }

            // TODO: Add code for the elephant

            // Note: We only push in a candidate path if at least one valve was chosen by you or the elephant
            if (someoneChoseAValve) {
                searchSpace.push(candidatePath);
                candidatePathsGenerated = true;
            }
        }

        if (!candidatePathsGenerated) {
            // we are also at a solution in such a state
            solutions.push(closePath(path));
        }


        (searchSpace.length % 1000 === 0) && console.log(`Search Space is now of size ${searchSpace.length}`);
    }

    return solutions;
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
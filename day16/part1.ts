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

// create a heuristic to determine the worth of a node. The worth is equivalent to the potential
// pressure that can be released given the remaining time and whether or not the valves near it
// are closed.
// KIV: Doesn't work
function evaluateValveWorth({remainingTime, id, visited, distances, volcano }: { remainingTime: number, id: string, visited: Array<string>, distances: Distances, volcano: Volcano }): number {
    let worth = 0;

    const distanceMap = distances[id];

    for (const valve in distanceMap) {
        // skip if the valve has been visited
        if (visited.includes(valve)) continue;

        const flowRate = volcano.valves[valve].flowRate;

        // add to the worth based on remainingTime - distance (to reach it) - 1 (to open it)
        worth += (remainingTime - distanceMap[valve] - 1) * flowRate;
    }

    return worth;
}

function failedSolution({ distances, volcano }: { distances: Distances, volcano: Volcano }): number {
    let remainingTime = 30;
    let totalFlowRate = 0;
    let pressureReleased = 0;
    let position = 'AA';
    let visited = [position]; // should this be empty?

    while (remainingTime > 0) {

        // find the best valve to visit
        const distanceMap = distances[position];
        let maxWorth = 0;
        let bestValve = position; // i.e. assume that staying put is the best option

        // evaluate all valves from the start position    
        for (let valve in distances[position]) {
            
            if (visited.includes(valve)) continue; // this feels inelegant

            const worth = evaluateValveWorth({ id: valve, remainingTime: remainingTime - distanceMap[valve], visited, distances, volcano });
            console.log(`Valve ${valve} has a worth of ${worth}`);
            if (worth > maxWorth) {
                maxWorth = worth;
                bestValve = valve;
            }
        }

        if (maxWorth === 0) {
            // we're done, all relevant valves are opened.
            pressureReleased += totalFlowRate * remainingTime;
            remainingTime = 0;
            break;
        }

        // we now have our target valve, "teleport" there and open the valve, releasing pressure
        console.log(`${bestValve} has the highest worth at ${maxWorth} at a distance of ${distanceMap[bestValve] + 1}`);
        visited.push(bestValve);        
        const timeElapsed = distanceMap[bestValve] + 1 // +1 to open it

        // simulate time passing
        remainingTime -= timeElapsed;
        console.log(`Assuming ${timeElapsed} minutes has passed, remaining ${remainingTime} minutes left.`);

        // simulate pressure released over time by already opened valves
        pressureReleased += totalFlowRate * timeElapsed;
        console.log(`${totalFlowRate * timeElapsed} additional pressure released, now at ${pressureReleased}`);

        // simulate new valve opened
        totalFlowRate += volcano.valves[bestValve].flowRate;
        console.log(`With a new flow rate of ${totalFlowRate}`);

        // simulate new position
        position = bestValve;
    }

    return pressureReleased;
}

type Path = {
    steps: Array<{
        id: string, // valve located at        

        // derived values
        timeRemaining: number,
        flowRate: number,
    }>,

    // derived globals
    totalPressureReleased: number,
    unvisited: Array<string>,
    finalTotal?: number
}

// Brute force search
function solve(volcano: Volcano, distances: Distances): Array<Path> {

    // only consider valves that can be opened
    const viableOptions: Array<Valve> = Object.values(volcano.valves).filter(valve => valve.flowRate !== 0);
    console.log(`Maximum search space size = ${viableOptions.length}!`);

    // BFS like sweep, potentially improvable by pruning
    const initialPath: Path = {
        steps: [{ id: volcano.start, timeRemaining: 30, flowRate: 0 }],

        totalPressureReleased: 0,
        unvisited: viableOptions.map(valve => valve.name)
    }

    const searchSpace: Array<Path> = [initialPath];
    const solutions: Array<Path> = [];

    while (searchSpace.length > 0) {
        const path = searchSpace.shift() as Path; // dequeue
        const lastPosition = path.steps[path.steps.length - 1];

        if (path.unvisited.length === 0) {
            // we have a "solution"
            const { flowRate, timeRemaining } = path.steps[path.steps.length - 1];
            path.finalTotal = path.totalPressureReleased + flowRate * timeRemaining;
            solutions.push(path);
            continue;
        }

        for (const valve of path.unvisited) {            
            // simulate "teleporting" to that valve and opening it
            const timeElapsed = distances[lastPosition.id][valve] + 1 // +1 to open it
            const timeRemaining = lastPosition.timeRemaining - timeElapsed;
            const flowRate = lastPosition.flowRate + volcano.valves[valve].flowRate;
            const totalPressureReleased = path.totalPressureReleased + lastPosition.flowRate * timeElapsed;
            const unvisited = [...path.unvisited];

            unvisited.splice(unvisited.indexOf(valve), 1);

            const nextStep = {
                id: valve,
                timeRemaining,
                flowRate
            };

            searchSpace.push({
                steps: [...path.steps, nextStep],

                totalPressureReleased,
                unvisited
            });
        }

        // (searchSpace.length % 1000 <= 100) && console.log(`Search Space is now of size ${searchSpace.length}`);
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
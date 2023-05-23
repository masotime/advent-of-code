import input from './input';

type Grid = {
    [row: number]: {
        [col: number]: string
    }
};

type Coordinate = {
    row: number,
    col: number
};

type Sensor = {
    position: Coordinate,
    beacon: Coordinate,
    radius: number, // add this for heuristic use
    noBeaconZone: (pos: Coordinate) => boolean,

    // exclusively for part 2 - any beacon must lie outside the radius
    // of the sensor. Assuming that there can be only one position
    // we only test positions that have a manhattan distance greater
    // than the radius
    candidateBeaconCol: (row: number) => [col1: number, col2: number]
}

type Tunnels = {
    grid: Grid,
    row: {
        min: number,
        max: number
    },
    col: {
        min: number,
        max: number
    },
    sensors: Array<Sensor>,
    beacons: Array<Coordinate>
};

const CHATGPT_REGEX = /x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)/;

// manhattan distance
function distance(loc1: Coordinate, loc2: Coordinate) {
    return Math.abs(loc1.row - loc2.row) + Math.abs(loc1.col - loc2.col);
}

function createNoBeaconFunction({ beacon, sensor }: { beacon: Coordinate, sensor: Coordinate }) {
    const radius = distance(beacon, sensor);

    return (c: Coordinate) => {
        const distFromSensor = distance(c, sensor);
        return distFromSensor <= radius;
    }
}

function createCandidateBeaconCol({ sensor, radius }: { radius: number, sensor: Coordinate }) {
    return (row: number): [number, number] => {
        const remainingDistance = radius - Math.abs(row - sensor.row);

        // there are two possible candidates since it is Math.abs
        // note that we subtract / add 1 to the distance since it must lie just outside
        // the "radius"
        return [sensor.col - remainingDistance - 1, sensor.col + remainingDistance + 1];
    }
}

function parseInput(input: string): Tunnels {
    const tunnels: Tunnels = {
        grid: {},

        row: {
            min: Number.MAX_SAFE_INTEGER,
            max: Number.MIN_SAFE_INTEGER
        },
        col: {
            min: Number.MAX_SAFE_INTEGER,
            max: Number.MIN_SAFE_INTEGER
        },

        sensors: [],
        beacons: []
    };

    const lines = input.split('\n');
    for (const line of lines) {
        const matches = line.match(CHATGPT_REGEX);
        if (!matches) {
            throw new Error(`Could not parse ${line} via Regex!`);
        }

        // note that x is the column, and y is the row.
        const [sensorCol, sensorRow, beaconCol, beaconRow] = matches.slice(1).map(Number) ;
        console.log({ sensorRow, sensorCol, beaconRow, beaconCol })

        // add both the sensors and the beacon, and also update the tunnel min/maxes
        const sensor = { row: sensorRow, col: sensorCol };
        const beacon = { row: beaconRow, col: beaconCol };

        // we need the radius because the min/max is affected by the sensor "range"
        // so the grid min/maxes have to fit accordingly
        const radius = distance(beacon, sensor);

        tunnels.sensors.push({
            position: sensor,
            beacon: beacon,
            radius,
            noBeaconZone: createNoBeaconFunction({ beacon, sensor }),
            candidateBeaconCol: createCandidateBeaconCol({ sensor, radius }),
        });

        tunnels.beacons.push({ row: beaconRow, col: beaconCol });

        tunnels.grid[sensorRow] = tunnels.grid[sensorRow] || {};
        tunnels.grid[sensorRow][sensorCol] = 'S';
        tunnels.grid[beaconRow] = tunnels.grid[beaconRow] || {};
        tunnels.grid[beaconRow][beaconCol] = 'B';


        tunnels.row.min = Math.min(sensorRow - radius, beaconRow, tunnels.row.min );
        tunnels.row.max = Math.max(sensorRow + radius, beaconRow, tunnels.row.max );
        tunnels.col.min = Math.min(sensorCol - radius, beaconCol, tunnels.col.min );
        tunnels.col.max = Math.max(sensorCol + radius, beaconCol, tunnels.col.max );
    }

    return tunnels;

}

function renderTunnels(tunnels: Tunnels, showNoBeacon: boolean = false): string {
    let render = '';

    for (let r = tunnels.row.min; r <= tunnels.row.max; r += 1) {
        render += r.toString().padStart(4, ' ') + ' ';
        for (let c = tunnels.col.min; c <= tunnels.col.max; c += 1) {
            let blankChar = '.';
            if (showNoBeacon) {
                // run through all the formulas for each sensor and set the blankChar
                // to # if at least one of them is true (i.e. it is a no beacon zone)
                for (const sensor of tunnels.sensors) {
                    if (sensor.noBeaconZone({ row: r, col: c })) {
                        blankChar = '#';
                        break;
                    }
                }
            }
            render += tunnels.grid[r]?.[c] ?? blankChar;
        }
        render += '\n';
    }

    return render;
}

function smartLocateBeacon(tunnels: Tunnels, { min, max }: { min: number, max: number }): number {
    let frequency = 0;

    for (let row = min; row <= max; row += 1) {
        if (row % 1000 === 0) console.log('checking row', row);

        // instead of going through all the columns, we accumulate all the candidate cols
        const colCandidates = new Set<number>();
        for (const sensor of tunnels.sensors) {
            const [col1, col2] = sensor.candidateBeaconCol(row);
            col1 >= min && col1 <= max && colCandidates.add(col1);
            col2 >= min && col2 <= max && colCandidates.add(col2);
        }

        // then we just check all the candidates
        for (const col of colCandidates) {
            // console.log(`Checking ${row}, ${col}`)
            let invalidCandidate = false;
            for (const sensor of tunnels.sensors) {
                if (sensor.noBeaconZone({ row, col })) {
                    invalidCandidate = true;
                    break;
                }
            }

            if (!invalidCandidate && tunnels.grid[row]?.[col] === undefined) {
                // assume this is our answer
                return col * 4000000 + row;
            }
        }
    }

    return frequency;
}

export default function() {
    const tunnels = parseInput(input);

    // render only if the tunnel isn't ridiuclously large
    if (tunnels.row.max - tunnels.row.min <= 200) {
        const render = renderTunnels(tunnels, true);
        console.log(render);    
    }

    console.log(tunnels.sensors);

    const frequency = smartLocateBeacon(tunnels, { min: 0, max: 4000000 });    
    return { tunnels, frequency };
}
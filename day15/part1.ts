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
    noBeaconZone: (pos: Coordinate) => boolean
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
        tunnels.sensors.push({
            position: sensor,
            beacon: beacon,
            noBeaconZone: createNoBeaconFunction({ beacon, sensor })
        });

        tunnels.beacons.push({ row: beaconRow, col: beaconCol });

        tunnels.grid[sensorRow] = tunnels.grid[sensorRow] || {};
        tunnels.grid[sensorRow][sensorCol] = 'S';
        tunnels.grid[beaconRow] = tunnels.grid[beaconRow] || {};
        tunnels.grid[beaconRow][beaconCol] = 'B';

        // we need the radius because the min/max is affected by the sensor "range"
        // so the grid min/maxes have to fit accordingly
        const radius = distance(beacon, sensor);

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

function calculateNoBeacons(row: number, tunnels: Tunnels): number {
    // just run through the min/maxes of the tunnel columns for that row,
    // and test each zone with the noBeaconZone formula
    let noBeaconCount = 0;
    for (let col = tunnels.col.min; col <= tunnels.col.max; col += 1) {
        let isNoBeaconZone = false;
        for (const sensor of tunnels.sensors) {
            if (sensor.noBeaconZone({ row, col })) {
                isNoBeaconZone = true;
                break;
            }
        }

        // increment only if there's a beacon or sensor there already
        if (tunnels.grid[row]?.[col] === undefined && isNoBeaconZone) {
            noBeaconCount += 1;
        }
    }

    return noBeaconCount;

}

export default function() {
    const tunnels = parseInput(input);

    // render only if the tunnel isn't ridiuclously large
    if (tunnels.row.max - tunnels.row.min <= 200) {
        const render = renderTunnels(tunnels, true);
        console.log(render);    
    }

    const noBeaconCount = calculateNoBeacons(2000000, tunnels);
    return { tunnels, noBeaconCount };
}
import input from './sample';

type CubeCoordinate = [number, number, number];
type CubeCollection = Array<CubeCoordinate>;

function parseInput(input: string): CubeCollection {
    const lines = input.split('\n');
    const result: CubeCollection = [];

    for (const line of lines) {
        const [x,y,z] = line.split(',');
        result.push([parseInt(x, 10), parseInt(y, 10), parseInt(z, 10)]);
    }

    return result;
}

type Coordinate = [number, number];

function solve(collection: CubeCollection) {

    // for each axis (x,y,z), group together coordinate pairs on the other axes

}

export default function() {
    const collection = parseInput(input);

    return { collection };
}
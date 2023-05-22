import type { Monkey } from './types';

export default `Monkey 0:
Starting items: 79, 98
Operation: new = old * 19
Test: divisible by 23
  If true: throw to monkey 2
  If false: throw to monkey 3

Monkey 1:
Starting items: 54, 65, 75, 74
Operation: new = old + 6
Test: divisible by 19
  If true: throw to monkey 2
  If false: throw to monkey 0

Monkey 2:
Starting items: 79, 60, 97
Operation: new = old * old
Test: divisible by 13
  If true: throw to monkey 1
  If false: throw to monkey 3

Monkey 3:
Starting items: 74
Operation: new = old + 3
Test: divisible by 17
  If true: throw to monkey 0
  If false: throw to monkey 1`;

// manually translated as I don't see the reason
// to parse the input if it's going to be so short and
// "meta"
export const monkeys: Array<Monkey> = [
  {
    id: 0,
    items: [79n, 98n],
    operation: (old) => old * 19n,
    test: (t) => t % 23n === 0n ? 2n : 3n,
    inspected: 0
  },
  {
    id: 1,
    items: [54n, 65n, 75n, 74n],
    operation: (old) => old + 6n,
    test: (t) => t % 19n === 0n ? 2n : 0n,
    inspected: 0
  },
  {
    id: 2,
    items: [79n, 60n, 97n],
    operation: (old) => old * old,
    test: (t) => t % 13n === 0n ? 1n : 3n,
    inspected: 0
  },
  {
    id: 3,
    items: [74n],
    operation: (old) => old + 3n,
    test: (t) => t % 17n === 0n ? 0n : 1n,
    inspected: 0
  },
]

// for part 2 - this is more mathematical than about coding, which
// is disappointing. I was wondering why all the tests used
// prime modulos... it really wasn't a coincidence.
export const combinedTestModulo = 23n * 19n * 13n * 17n;
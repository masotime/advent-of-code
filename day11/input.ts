import type { Monkey } from './types';

export default `Monkey 0:
Starting items: 71, 56, 50, 73
Operation: new = old * 11
Test: divisible by 13
  If true: throw to monkey 1
  If false: throw to monkey 7

Monkey 1:
Starting items: 70, 89, 82
Operation: new = old + 1
Test: divisible by 7
  If true: throw to monkey 3
  If false: throw to monkey 6

Monkey 2:
Starting items: 52, 95
Operation: new = old * old
Test: divisible by 3
  If true: throw to monkey 5
  If false: throw to monkey 4

Monkey 3:
Starting items: 94, 64, 69, 87, 70
Operation: new = old + 2
Test: divisible by 19
  If true: throw to monkey 2
  If false: throw to monkey 6

Monkey 4:
Starting items: 98, 72, 98, 53, 97, 51
Operation: new = old + 6
Test: divisible by 5
  If true: throw to monkey 0
  If false: throw to monkey 5

Monkey 5:
Starting items: 79
Operation: new = old + 7
Test: divisible by 2
  If true: throw to monkey 7
  If false: throw to monkey 0

Monkey 6:
Starting items: 77, 55, 63, 93, 66, 90, 88, 71
Operation: new = old * 7
Test: divisible by 11
  If true: throw to monkey 2
  If false: throw to monkey 4

Monkey 7:
Starting items: 54, 97, 87, 70, 59, 82, 59
Operation: new = old + 8
Test: divisible by 17
  If true: throw to monkey 1
  If false: throw to monkey 3`


// manually translated as I don't see the reason
// to parse the input if it's going to be so short and
// "meta"
export const monkeys: Array<Monkey> = [
  {
    id: 0,
    items: [71n, 56n, 50n, 73n],
    operation: (old) => old * 11n,
    test: (t) => t % 13n === 0n ? 1n : 7n,
    inspected: 0
  },
  {
    id: 1,
    items: [70n, 89n, 82n],
    operation: (old) => old + 1n,
    test: (t) => t % 7n === 0n ? 3n : 6n,
    inspected: 0
  },
  {
    id: 2,
    items: [52n, 95n],
    operation: (old) => old * old,
    test: (t) => t % 3n === 0n ? 5n : 4n,
    inspected: 0
  },
  {
    id: 3,
    items: [94n, 64n, 69n, 87n, 70n],
    operation: (old) => old + 2n,
    test: (t) => t % 19n === 0n ? 2n : 6n,
    inspected: 0
  },
  {
    id: 4,
    items: [98n, 72n, 98n, 53n, 97n, 51n],
    operation: (old) => old + 6n,
    test: (t) => t % 5n === 0n ? 0n : 5n,
    inspected: 0
  },
  {
    id: 5,
    items: [79n],
    operation: (old) => old + 7n,
    test: (t) => t % 2n === 0n ? 7n : 0n,
    inspected: 0
  },
  {
    id: 6,
    items: [77n, 55n, 63n, 93n, 66n, 90n, 88n, 71n],
    operation: (old) => old * 7n,
    test: (t) => t % 11n === 0n ? 2n : 4n,
    inspected: 0
  },
  {
    id: 7,
    items: [54n, 97n, 87n, 70n, 59n, 82n, 59n],
    operation: (old) => old + 8n,
    test: (t) => t % 17n === 0n ? 1n : 3n,
    inspected: 0
  },
]

// for part 2 - this is more mathematical than about coding, which
// is disappointing. I was wondering why all the tests used
// prime modulos... it really wasn't a coincidence.
export const combinedTestModulo = 13n * 7n * 3n * 19n * 5n * 2n * 11n * 17n;
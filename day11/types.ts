export type Monkey = {
    id: number,
    items: Array<bigint>,
    operation: (old: bigint) => bigint,
    test: (t: bigint) => bigint, // which monkey to throw to
    inspected: number
  }
import { describe, it, expect } from 'vitest';
import { BTree } from '../btree';

// ORDER is 4, so a node holds at most 3 keys and the root splits on the fourth
// insert. Anything below four keys never produces an internal node, which is why
// these tests insert enough rows to force one - the bugs covered here only exist
// above the leaf.
const build = (n: number) => {
  const tree = new BTree<number>();
  for (let i = 1; i <= n; i++) tree.insert(i, `r${i}`);
  return tree;
};
const keysOf = (tree: BTree<number>) => tree.getAll().map(e => e.key);

describe('BTree delete', () => {
  it('keeps every other key reachable after deleting one held by an internal node', () => {
    const tree = build(8);
    // key 2 is a separator in the root once 1..8 are in
    expect(tree.delete(2, 'r2')).toBe(true);

    expect(keysOf(tree)).toEqual([1, 3, 4, 5, 6, 7, 8]);
    for (const k of [1, 3, 4, 5, 6, 7, 8]) {
      expect(tree.search(k)).toEqual([`r${k}`]);
    }
    expect(tree.search(2)).toEqual([]);
  });

  it('deletes every key in turn without losing the rest', () => {
    for (let victim = 1; victim <= 8; victim++) {
      const tree = build(8);
      expect(tree.delete(victim, `r${victim}`)).toBe(true);

      const survivors = [1, 2, 3, 4, 5, 6, 7, 8].filter(k => k !== victim);
      expect(keysOf(tree)).toEqual(survivors);
      for (const k of survivors) expect(tree.search(k)).toEqual([`r${k}`]);
      expect(tree.search(victim)).toEqual([]);
    }
  });

  it('leaves a range search correct after a delete', () => {
    const tree = build(8);
    tree.delete(4, 'r4');
    expect(tree.rangeSearch(1, 8)).toEqual(['r1', 'r2', 'r3', 'r5', 'r6', 'r7', 'r8']);
  });

  it('drops only the row asked for when a key holds several', () => {
    const tree = build(8);
    tree.insert(5, 'extra');
    expect(tree.delete(5, 'r5')).toBe(true);
    expect(tree.search(5)).toEqual(['extra']);
    expect(keysOf(tree)).toContain(5);
  });

  it('reports false for a row that is not there', () => {
    const tree = build(8);
    expect(tree.delete(4, 'nope')).toBe(false);
    expect(tree.delete(99, 'r99')).toBe(false);
    expect(keysOf(tree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('can reinsert a key that was deleted', () => {
    const tree = build(8);
    tree.delete(2, 'r2');
    tree.insert(2, 'again');
    expect(tree.search(2)).toEqual(['again']);
    expect(keysOf(tree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('BTree insert', () => {
  it('stores every row under one key when the key sits in an internal node', () => {
    const tree = build(8);
    for (let k = 1; k <= 8; k++) tree.insert(k, `second${k}`);

    for (let k = 1; k <= 8; k++) {
      expect(tree.search(k).sort()).toEqual([`r${k}`, `second${k}`].sort());
    }
    expect(keysOf(tree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('ignores a row id already stored under the key', () => {
    const tree = build(8);
    tree.insert(4, 'r4');
    expect(tree.search(4)).toEqual(['r4']);
  });

  it('keeps keys in order however they arrive', () => {
    const tree = new BTree<number>();
    for (const k of [7, 2, 9, 1, 5, 3, 8, 4, 6]) tree.insert(k, `r${k}`);
    expect(keysOf(tree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

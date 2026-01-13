// B-Tree Index Implementation

const ORDER = 4; // B-tree order (max children per node)

interface BTreeNode<K> {
  keys: K[];
  values: string[][]; // Each key maps to array of row IDs
  children: BTreeNode<K>[];
  isLeaf: boolean;
}

export class BTree<K> {
  private root: BTreeNode<K>;
  private compare: (a: K, b: K) => number;

  constructor(compareFn?: (a: K, b: K) => number) {
    this.root = { keys: [], values: [], children: [], isLeaf: true };
    this.compare = compareFn || this.defaultCompare;
  }

  private defaultCompare(a: K, b: K): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  // Insert a key-value pair
  insert(key: K, rowId: string): void {
    const root = this.root;
    
    // If root is full, split it
    if (root.keys.length === ORDER - 1) {
      const newRoot: BTreeNode<K> = { keys: [], values: [], children: [root], isLeaf: false };
      this.splitChild(newRoot, 0);
      this.root = newRoot;
    }
    
    this.insertNonFull(this.root, key, rowId);
  }

  private insertNonFull(node: BTreeNode<K>, key: K, rowId: string): void {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // Find position for key
      while (i >= 0 && this.compare(key, node.keys[i]) < 0) {
        i--;
      }
      
      // Check if key already exists
      if (i >= 0 && this.compare(key, node.keys[i]) === 0) {
        // Key exists, add rowId to values
        if (!node.values[i].includes(rowId)) {
          node.values[i].push(rowId);
        }
        return;
      }
      
      // Insert new key
      node.keys.splice(i + 1, 0, key);
      node.values.splice(i + 1, 0, [rowId]);
    } else {
      // Find child to descend into
      while (i >= 0 && this.compare(key, node.keys[i]) < 0) {
        i--;
      }
      i++;

      // Check if child is full
      if (node.children[i].keys.length === ORDER - 1) {
        this.splitChild(node, i);
        if (this.compare(key, node.keys[i]) > 0) {
          i++;
        }
      }

      this.insertNonFull(node.children[i], key, rowId);
    }
  }

  private splitChild(parent: BTreeNode<K>, index: number): void {
    const child = parent.children[index];
    const mid = Math.floor((ORDER - 1) / 2);

    const newChild: BTreeNode<K> = {
      keys: child.keys.splice(mid + 1),
      values: child.values.splice(mid + 1),
      children: child.isLeaf ? [] : child.children.splice(mid + 1),
      isLeaf: child.isLeaf,
    };

    const midKey = child.keys.pop()!;
    const midValue = child.values.pop()!;

    parent.keys.splice(index, 0, midKey);
    parent.values.splice(index, 0, midValue);
    parent.children.splice(index + 1, 0, newChild);
  }

  // Search for a key
  search(key: K): string[] {
    return this.searchNode(this.root, key);
  }

  private searchNode(node: BTreeNode<K>, key: K): string[] {
    let i = 0;
    
    while (i < node.keys.length && this.compare(key, node.keys[i]) > 0) {
      i++;
    }

    if (i < node.keys.length && this.compare(key, node.keys[i]) === 0) {
      return node.values[i];
    }

    if (node.isLeaf) {
      return [];
    }

    return this.searchNode(node.children[i], key);
  }

  // Range search: find all values where key is between min and max
  rangeSearch(min: K, max: K): string[] {
    const results: string[] = [];
    this.rangeSearchNode(this.root, min, max, results);
    return results;
  }

  private rangeSearchNode(node: BTreeNode<K>, min: K, max: K, results: string[]): void {
    let i = 0;

    while (i < node.keys.length) {
      if (!node.isLeaf && this.compare(min, node.keys[i]) <= 0) {
        this.rangeSearchNode(node.children[i], min, max, results);
      }

      if (this.compare(node.keys[i], min) >= 0 && this.compare(node.keys[i], max) <= 0) {
        results.push(...node.values[i]);
      }

      if (this.compare(node.keys[i], max) > 0) {
        break;
      }

      i++;
    }

    if (!node.isLeaf && i < node.children.length) {
      this.rangeSearchNode(node.children[i], min, max, results);
    }
  }

  // Delete a rowId from a key
  delete(key: K, rowId: string): boolean {
    return this.deleteFromNode(this.root, key, rowId);
  }

  private deleteFromNode(node: BTreeNode<K>, key: K, rowId: string): boolean {
    let i = 0;
    
    while (i < node.keys.length && this.compare(key, node.keys[i]) > 0) {
      i++;
    }

    if (i < node.keys.length && this.compare(key, node.keys[i]) === 0) {
      const valueIndex = node.values[i].indexOf(rowId);
      if (valueIndex !== -1) {
        node.values[i].splice(valueIndex, 1);
        
        // If no more values for this key, remove the key
        if (node.values[i].length === 0) {
          node.keys.splice(i, 1);
          node.values.splice(i, 1);
        }
        
        return true;
      }
      return false;
    }

    if (node.isLeaf) {
      return false;
    }

    return this.deleteFromNode(node.children[i], key, rowId);
  }

  // Get all entries (for debugging/serialization)
  getAll(): Array<{ key: K; rowIds: string[] }> {
    const entries: Array<{ key: K; rowIds: string[] }> = [];
    this.collectEntries(this.root, entries);
    return entries;
  }

  private collectEntries(node: BTreeNode<K>, entries: Array<{ key: K; rowIds: string[] }>): void {
    for (let i = 0; i < node.keys.length; i++) {
      if (!node.isLeaf && node.children[i]) {
        this.collectEntries(node.children[i], entries);
      }
      entries.push({ key: node.keys[i], rowIds: [...node.values[i]] });
    }
    
    if (!node.isLeaf && node.children[node.keys.length]) {
      this.collectEntries(node.children[node.keys.length], entries);
    }
  }

  // Serialize for storage
  serialize(): string {
    return JSON.stringify(this.root);
  }

  // Deserialize from storage
  static deserialize<K>(data: string, compareFn?: (a: K, b: K) => number): BTree<K> {
    const tree = new BTree<K>(compareFn);
    tree.root = JSON.parse(data);
    return tree;
  }
}
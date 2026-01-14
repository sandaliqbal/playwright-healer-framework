import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type SnapshotNode =
  | Record<string, any>
  | any[]
  | string;

export type TextMatch = [
  matchedText: string,
  rootParent?: string,
  currentParent?: string
];

export async function loadSnapshot(path: string): Promise<any[]> {
  const content = fs.readFileSync(path, 'utf-8');
  return yaml.load(content) as any[];
}

export function findElementsByText(
  snapshot: any[],
  text: string
): TextMatch[] {
  const matches: TextMatch[] = [];
  const search = text.toLowerCase();

  function walk(
    node: SnapshotNode,
    rootParent?: string,
    currentParent?: string
  ) {
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      for (const [key, value] of Object.entries(node)) {
        // Set root parent only once (highest level)
        const newRoot = rootParent ?? key;

        if (key.toLowerCase().includes(search)) {
          matches.push([key, newRoot, currentParent]);
        }

        walk(value, newRoot, key);
      }
    } else if (Array.isArray(node)) {
      for (const item of node) {
        walk(item, rootParent, currentParent);
      }
    } else if (typeof node === 'string') {
      if (node.toLowerCase().includes(search)) {
        matches.push([node, rootParent, currentParent]);
      }
    }
  }

  walk(snapshot);
  return matches;
}

export type RichTextNode =
  | string
  | {
      text?: string;
      children?: RichTextNode[];
    };

export type RichTextValue = RichTextNode | RichTextNode[];

export function nodeToText(node: RichTextValue | null | undefined): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(nodeToText).join('');
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.children)) return node.children.map(nodeToText).join('');
  return '';
}

export function blocksToText(value: RichTextValue | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return nodeToText(value);

  return value
    .map((block) => nodeToText(block))
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

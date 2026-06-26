import type { ReactNode } from 'react';
import type { RichTextValue } from '@/lib/richtext';

type RichTextTextNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
};

type RichTextBlockNode = {
  type?: string;
  format?: 'ordered' | 'unordered';
  listStyle?: 'disc' | 'decimal' | 'lower-roman' | 'lower-alpha';
  level?: number;
  children?: Array<RichTextBlockNode | RichTextTextNode>;
};

type ParagraphListMarker = {
  format: 'ordered' | 'unordered';
  listStyle: 'disc' | 'decimal' | 'lower-roman' | 'lower-alpha';
  pattern: RegExp;
};

function normalizeWhitespace(text: string): string {
  return text.replace(/[\t\r\n ]+/g, ' ').trim();
}

function isTextNode(node: RichTextBlockNode | RichTextTextNode): node is RichTextTextNode {
  return 'text' in node;
}

function renderInlineNode(node: RichTextBlockNode | RichTextTextNode, key: string): ReactNode {
  if (isTextNode(node)) {
    const text = node.code ? node.text || '' : normalizeWhitespace(node.text || '');
    let out: ReactNode = text;
    if (node.code) out = <code key={`${key}-code`}>{out}</code>;
    if (node.underline) out = <u key={`${key}-underline`}>{out}</u>;
    if (node.italic) out = <em key={`${key}-italic`}>{out}</em>;
    if (node.strikethrough) out = <s key={`${key}-strike`}>{out}</s>;
    if (node.bold) out = <strong key={`${key}-bold`}>{out}</strong>;
    return <span key={key}>{out}</span>;
  }

  return (
    <span key={key}>
      {(node.children || []).map((child, index) => renderInlineNode(child, `${key}-${index}`))}
    </span>
  );
}

function getInlineText(children: Array<RichTextBlockNode | RichTextTextNode> | undefined): string {
  return (children || [])
    .map((child) => {
      if (isTextNode(child)) return normalizeWhitespace(child.text || '');
      return getInlineText(child.children);
    })
    .join(' ')
    .trim();
}

function isSectionHeading(block: RichTextBlockNode): boolean {
  const children = block.children || [];
  if (block.type !== 'paragraph' || children.length !== 1 || !isTextNode(children[0])) return false;
  const child = children[0];
  return Boolean(child.bold && (child.text || '').trim());
}

function detectParagraphListMarker(block: RichTextBlockNode): ParagraphListMarker | null {
  if (block.type !== 'paragraph' || isSectionHeading(block)) return null;
  const text = getInlineText(block.children);
  if (!text || text.length > 260) return null;

  const markers: ParagraphListMarker[] = [
    { format: 'unordered', listStyle: 'disc', pattern: /^[-*•]\s+/u },
    { format: 'ordered', listStyle: 'decimal', pattern: /^\d+[.)]\s+/u },
    { format: 'ordered', listStyle: 'lower-roman', pattern: /^(?=[ivxlcdm]+[.)]\s+)[ivxlcdm]+[.)]\s+/iu },
    { format: 'ordered', listStyle: 'lower-alpha', pattern: /^[a-z][.)]\s+/u },
  ];

  for (const marker of markers) {
    if (marker.pattern.test(text)) return marker;
  }

  if (/[;.]$/.test(text)) {
    return { format: 'unordered', listStyle: 'disc', pattern: /^/u };
  }

  return null;
}

function stripMarkerFromChildren(
  children: Array<RichTextBlockNode | RichTextTextNode> | undefined,
  pattern: RegExp,
): Array<RichTextBlockNode | RichTextTextNode> {
  let stripped = false;

  return (children || []).map((child) => {
    if (isTextNode(child)) {
      const originalText = child.text || '';
      if (!stripped) {
        const nextText = originalText.replace(pattern, '');
        if (nextText !== originalText) {
          stripped = true;
          return { ...child, text: nextText };
        }
      }
      return { ...child, text: normalizeWhitespace(originalText) };
    }

    return {
      ...child,
      children: stripMarkerFromChildren(child.children, pattern),
    };
  });
}

function isMeaningfulSpacer(block: RichTextBlockNode): boolean {
  return block.type === 'paragraph' && !getInlineText(block.children);
}

function normalizeBlocks(value: RichTextValue | null | undefined): RichTextBlockNode[] {
  if (!Array.isArray(value)) return [];
  const blocks = value as RichTextBlockNode[];
  const merged: RichTextBlockNode[] = [];

  for (const block of blocks) {
    const prev = merged[merged.length - 1];
    if (
      block.type === 'list' &&
      prev?.type === 'list' &&
      prev.format === block.format
    ) {
      prev.children = [...(prev.children || []), ...(block.children || [])];
      continue;
    }
    merged.push({
      ...block,
      children: [...(block.children || [])],
    });
  }

  const normalized: RichTextBlockNode[] = [];
  for (let index = 0; index < merged.length; index += 1) {
    const block = merged[index];
    const marker = detectParagraphListMarker(block);

    if (marker) {
      const run: RichTextBlockNode[] = [block];
      let cursor = index + 1;
      while (cursor < merged.length) {
        const nextBlock = merged[cursor];
        if (isMeaningfulSpacer(nextBlock)) {
          cursor += 1;
          continue;
        }

        const nextMarker = detectParagraphListMarker(nextBlock);
        if (!nextMarker || nextMarker.format !== marker.format || nextMarker.listStyle !== marker.listStyle) {
          break;
        }

        run.push(nextBlock);
        cursor += 1;
      }

      if (run.length >= 2) {
        normalized.push({
          type: 'list',
          format: marker.format,
          listStyle: marker.listStyle,
          children: run.map((item) => ({
            type: 'list-item',
            children: stripMarkerFromChildren(item.children, marker.pattern),
          })),
        });
        index = cursor - 1;
        continue;
      }
    }

    normalized.push(block);
  }

  return normalized;
}

export function RichText({ value }: { value: RichTextValue | null | undefined }) {
  const blocks = normalizeBlocks(value);

  if (!blocks.length) {
    return <p>Contenu détaillé à compléter.</p>;
  }

  return (
    <div className="rich-text-content">
      {blocks.map((block, index) => {
        const key = `${block.type || 'block'}-${index}`;
        const children = block.children || [];
        const hasMeaningfulText = getInlineText(children).length > 0;

        if (!hasMeaningfulText && block.type !== 'list') {
          return <div key={key} className="rich-text-spacer" aria-hidden="true" />;
        }

        if (block.type === 'heading') {
          const level = Math.min(Math.max(block.level || 2, 2), 4);
          if (level === 2) return <h2 key={key}>{children.map((child, childIndex) => renderInlineNode(child, `${key}-${childIndex}`))}</h2>;
          if (level === 3) return <h3 key={key}>{children.map((child, childIndex) => renderInlineNode(child, `${key}-${childIndex}`))}</h3>;
          return <h4 key={key}>{children.map((child, childIndex) => renderInlineNode(child, `${key}-${childIndex}`))}</h4>;
        }

        if (isSectionHeading(block)) {
          return <h3 key={key}>{getInlineText(children)}</h3>;
        }

        if (block.type === 'list') {
          const Tag = block.format === 'ordered' ? 'ol' : 'ul';
          return (
            <Tag key={key} className={block.listStyle ? `list-style-${block.listStyle}` : undefined}>
              {children.map((child, childIndex) => {
                const itemChildren = !isTextNode(child) ? child.children || [] : [child];
                return (
                  <li key={`${key}-${childIndex}`}>
                    {itemChildren.map((itemChild, itemIndex) => renderInlineNode(itemChild, `${key}-${childIndex}-${itemIndex}`))}
                  </li>
                );
              })}
            </Tag>
          );
        }

        return (
          <p key={key}>
            {children.map((child, childIndex) => renderInlineNode(child, `${key}-${childIndex}`))}
          </p>
        );
      })}
    </div>
  );
}

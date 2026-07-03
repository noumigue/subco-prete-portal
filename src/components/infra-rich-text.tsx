import type { ReactNode } from 'react';
import type { RichTextValue } from '@/lib/richtext';

type RichTextTextNode = {
  type?: string;
  text?: string;
  bold?: boolean;
};

type RichTextBlockNode = {
  type?: string;
  format?: 'ordered' | 'unordered';
  level?: number;
  children?: Array<RichTextBlockNode | RichTextTextNode>;
};

function isTextNode(node: RichTextBlockNode | RichTextTextNode): node is RichTextTextNode {
  return 'text' in node;
}

function renderInlineNode(node: RichTextBlockNode | RichTextTextNode, key: string): ReactNode {
  if (isTextNode(node)) {
    let content: ReactNode = node.text || '';
    if (node.bold) content = <b key={`${key}-bold`}>{content}</b>;
    return <span key={key}>{content}</span>;
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
      if (isTextNode(child)) return child.text || '';
      return getInlineText(child.children);
    })
    .join('')
    .trim();
}

export function InfraRichText({
  value,
  immaterial = false,
}: {
  value: RichTextValue | null | undefined;
  immaterial?: boolean;
}) {
  const blocks = Array.isArray(value) ? (value as RichTextBlockNode[]) : [];

  return (
    <div className={immaterial ? 'infra-rtf imm' : 'infra-rtf'}>
      {blocks.map((block, index) => {
        const key = `${block.type || 'block'}-${index}`;
        const children = block.children || [];

        if (block.type === 'heading') {
          const level = block.level || 2;
          if (level === 2) {
            return <h2 key={key}>{children.map((child, childIndex) => renderInlineNode(child, `${key}-${childIndex}`))}</h2>;
          }

          return <h3 key={key}>{children.map((child, childIndex) => renderInlineNode(child, `${key}-${childIndex}`))}</h3>;
        }

        if (block.type === 'list') {
          return (
            <ul key={key}>
              {children.map((child, childIndex) => {
                const itemChildren = !isTextNode(child) ? child.children || [] : [child];
                return (
                  <li key={`${key}-${childIndex}`}>
                    {itemChildren.map((itemChild, itemIndex) => renderInlineNode(itemChild, `${key}-${childIndex}-${itemIndex}`))}
                  </li>
                );
              })}
            </ul>
          );
        }

        if (!getInlineText(children)) return null;

        return (
          <p key={key}>
            {children.map((child, childIndex) => renderInlineNode(child, `${key}-${childIndex}`))}
          </p>
        );
      })}
    </div>
  );
}

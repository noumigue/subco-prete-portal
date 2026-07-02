'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { RichTextValue } from '@/lib/richtext';
import type { FaqTheme, FaqTopicItem } from '@/lib/strapi-public';

type Props = {
  items: FaqTopicItem[];
  compact?: boolean;
};

type ThemeDef = {
  id: FaqTheme;
  label: string;
  color: string;
  bg: string;
  icon: ReactNode;
};

const THEMES: ThemeDef[] = [
  {
    id: 'eligibilite',
    label: 'Éligibilité',
    color: '#27500A',
    bg: '#EAF3DE',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    id: 'dossier',
    label: 'Dossier',
    color: '#0C447C',
    bg: '#E6F1FB',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    ),
  },
  {
    id: 'financement',
    label: 'Financement',
    color: '#633806',
    bg: '#FAEEDA',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v2" />
        <path d="M12 16v2" />
        <path d="M8.5 11h7" />
        <path d="M8.5 15h7" />
      </svg>
    ),
  },
  {
    id: 'selection',
    label: 'Sélection & suivi',
    color: '#3C3489',
    bg: '#EEEDFE',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1" />
      </svg>
    ),
  },
];

type BlockNode = {
  type?: string;
  format?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
  children?: BlockNode[];
};

function renderInline(nodes: BlockNode[] = [], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.type === 'link') {
      return (
        <a key={key} href={node.url || '#'} target="_blank" rel="noreferrer">
          {renderInline(node.children || [], `${key}-link`)}
        </a>
      );
    }

    if (node.text !== undefined) {
      let content: ReactNode = node.text;
      if (node.bold) content = <strong>{content}</strong>;
      if (node.italic) content = <em>{content}</em>;
      if (node.underline) content = <u>{content}</u>;
      return <span key={key}>{content}</span>;
    }

    return <span key={key}>{renderInline(node.children || [], `${key}-children`)}</span>;
  });
}

function renderBlocks(value: RichTextValue | null | undefined, keyPrefix: string) {
  if (!Array.isArray(value)) return null;

  return value.map((block, index) => {
    const item = block as BlockNode;
    const key = `${keyPrefix}-${index}`;

    if (item.type === 'paragraph') {
      return <p key={key}>{renderInline(item.children || [], key)}</p>;
    }

    if (item.type === 'list') {
      const Tag = item.format === 'ordered' ? 'ol' : 'ul';
      return (
        <Tag key={key}>
          {(item.children || []).map((child, childIndex) => (
            <li key={`${key}-${childIndex}`}>{renderInline(child.children || [], `${key}-${childIndex}`)}</li>
          ))}
        </Tag>
      );
    }

    return <p key={key}>{renderInline(item.children || [], key)}</p>;
  });
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span className={`faqv2-chevron${open ? ' open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}

export default function FaqSection({ items, compact = false }: Props) {
  const [activeTheme, setActiveTheme] = useState<FaqTheme>('eligibilite');
  const [openIndex, setOpenIndex] = useState<number>(-1);

  const grouped = useMemo(() => {
    const map = new Map<FaqTheme, FaqTopicItem[]>();
    for (const theme of THEMES) map.set(theme.id, []);

    for (const item of items) {
      if (!item.theme) continue;
      map.set(item.theme, [...(map.get(item.theme) || []), item]);
    }

    return map;
  }, [items]);

  const activeItems = grouped.get(activeTheme) || [];
  const activeThemeDef = THEMES.find((theme) => theme.id === activeTheme) || THEMES[0];

  return (
    <div
      className={`faqv2${compact ? ' faqv2-compact' : ''}`}
      style={
        {
          '--faq-theme-tint': activeThemeDef.bg,
          '--faq-theme-color': activeThemeDef.color,
        } as React.CSSProperties
      }
    >
      {!compact ? (
        <div className="faqv2-header">
          <p className="faqv2-eyebrow">Questions fréquentes</p>
          <h1 className="faqv2-title">Tout ce que vous devez savoir</h1>
          <p className="faqv2-subtitle">{items.length} questions · {THEMES.length} thèmes</p>
        </div>
      ) : (
        <div className="faqv2-header faqv2-header-compact">
          <p className="faqv2-eyebrow">Questions fréquentes</p>
          <h2 className="faqv2-title">Tout ce que vous devez savoir</h2>
        </div>
      )}

      <div className="faqv2-box">
        <div className="faqv2-themes">
          {THEMES.map((theme) => {
            const count = grouped.get(theme.id)?.length || 0;
            const active = theme.id === activeTheme;

            return (
              <button
                key={theme.id}
                type="button"
                className={`faqv2-theme-btn${active ? ' active' : ''}`}
                style={{ color: theme.color, background: active ? theme.bg : '#f7f6f3' }}
                onClick={() => {
                  setActiveTheme(theme.id);
                  setOpenIndex(-1);
                }}
              >
                <span
                  className="faqv2-theme-icon"
                  style={{ background: active ? 'rgba(255,255,255,0.58)' : '#fff' }}
                  aria-hidden="true"
                >
                  {theme.icon}
                </span>
                <span className="faqv2-theme-copy">
                  <span className="faqv2-theme-name">{theme.label}</span>
                  <span className="faqv2-theme-count">{count} questions</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="faqv2-questions">
          {activeItems.length ? (
            activeItems.map((item, index) => {
              const open = openIndex === index;
              return (
                <article
                  key={item.id}
                  className={`faqv2-question${open ? ' active' : ''}`}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                >
                  <div className="faqv2-question-head">
                    <h3 className="faqv2-question-text">{item.question || 'Question'}</h3>
                    <Chevron open={open} />
                  </div>
                  {open ? <div className="faqv2-answer">{renderBlocks(item.reponse, `faq-${item.id}`)}</div> : null}
                </article>
              );
            })
          ) : (
            <p className="faqv2-error">Impossible de charger les questions — actualisez la page.</p>
          )}
        </div>
      </div>
    </div>
  );
}

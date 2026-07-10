// Extraction texte d'un rich-text « blocks » Strapi (rendu sobre, sans dependance).
export type PortalBlockLike = {
  type?: string;
  children?: { text?: string; children?: { text?: string }[] }[];
};

export function blocksToText(blocks?: PortalBlockLike[]): string {
  if (!Array.isArray(blocks)) return '';
  const lines: string[] = [];
  for (const block of blocks) {
    const text = (block.children || [])
      .map((child) => (child.text ?? (child.children || []).map((c) => c.text || '').join('')))
      .join('')
      .trim();
    if (text) lines.push(text);
  }
  return lines.join('\n');
}

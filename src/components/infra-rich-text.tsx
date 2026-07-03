import { RichText } from '@/components/rich-text';
import type { RichTextValue } from '@/lib/richtext';

export function InfraRichText({
  value,
  immaterial = false,
}: {
  value: RichTextValue | null | undefined;
  immaterial?: boolean;
}) {
  return <RichText value={value} className={immaterial ? 'infra-rtf imm' : 'infra-rtf'} />;
}

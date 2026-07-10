'use client';

import { resoudreAssistanceAction } from '@/app/(operator)/actions';

// « Ma question est résolue » — confirmation simple (A1) : le fil sera clos, pas de réouverture.
export function OperatorResolveButton({ documentId }: { documentId: string }) {
  return (
    <form
      action={resoudreAssistanceAction}
      onSubmit={(event) => {
        if (!window.confirm('Le fil sera clos et ne pourra pas être rouvert. Marquer comme résolue ?')) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="documentId" value={documentId} />
      <button type="submit" className="operator-secondary-btn operator-btn-sm">✓ Ma question est résolue</button>
    </form>
  );
}

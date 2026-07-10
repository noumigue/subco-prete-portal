'use client';

import { deleteDraftAction } from '@/app/(operator)/actions';

// Confirmation simple de suppression d'un brouillon (remediation 1.5 / fiche M1).
// « Cette action est definitive » — pas de saisie de securite. Le refus cote API
// (statut != brouillon) reste la garde autoritative.
export function OperatorDeleteDraftButton({ documentId }: { documentId: string }) {
  return (
    <form
      action={deleteDraftAction}
      onSubmit={(event) => {
        if (!window.confirm('Supprimer ce brouillon ? Cette action est définitive.')) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="documentId" value={documentId} />
      <button type="submit" className="operator-danger-btn operator-btn-sm">🗑 Supprimer</button>
    </form>
  );
}

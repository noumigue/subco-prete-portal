import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPortalDemandeAssistance } from '@/lib/portal-api';
import { portalMediaUrl } from '@/lib/portal-media';
import { repondreAssistanceAction } from '../../../actions';
import { OperatorResolveButton } from '@/components/operator-resolve-button';

function statutPill(statut?: string) {
  if (statut === 'resolue') return { label: '✓ Résolue', cls: 'pill-res' };
  if (statut === 'en_cours') return { label: '⏳ En cours', cls: 'pill-cours' };
  return { label: '● Ouverte', cls: 'pill-open' };
}

function formatDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function AssistanceThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ documentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { documentId } = await params;
  const query = await searchParams;
  const error = Array.isArray(query.error) ? query.error[0] : query.error;
  const demande = await getPortalDemandeAssistance(documentId);
  if (!demande) notFound();

  const pill = statutPill(demande.statut);
  const closed = demande.statut === 'resolue';
  const concerne = demande.concerneCandidature?.numeroDossier || demande.concerneSubvention?.numeroConvention;
  const messages = (demande.messages || []).slice().sort((a, b) => (a.envoyeLe || '').localeCompare(b.envoyeLe || ''));

  return (
    <div className="operator-page">
      <Link href="/assistance" className="operator-back-link">← Mes demandes</Link>

      <div className="operator-dossier-head">
        <div>
          <h1>{demande.objet}</h1>
          <div className="operator-assist-info">
            <span className={`operator-pill ${pill.cls}`}>{pill.label}</span>
            {demande.categorie?.libelle ? <span>{demande.categorie.libelle}</span> : null}
            {concerne ? <span className="operator-candidature-num">{concerne}</span> : <span className="operator-muted">Question générale</span>}
          </div>
        </div>
      </div>

      {closed ? (
        <div className="operator-resolved-banner">
          ✓ Résolue le {formatDateTime(demande.resolueLe || undefined)}{demande.resoluePar === 'operateur' ? ' — marquée résolue par vous' : ''}
        </div>
      ) : null}
      {error ? <p className="operator-auth-error">Votre message n’a pas pu être envoyé. Réessayez.</p> : null}

      <section className="operator-thread">
        {messages.map((m) => (
          <div key={m.documentId} className={`operator-msg ${m.auteur === 'operateur' ? 'is-op' : 'is-eq'}`}>
            <p className="operator-msg-who">{m.auteur === 'operateur' ? 'Vous' : 'Équipe projet'} · {formatDateTime(m.envoyeLe)}</p>
            <div className="operator-msg-bubble">
              {m.corps}
              {(m.pieces || []).map((p, i) => {
                const url = portalMediaUrl(p.url);
                return url ? (
                  <a key={i} href={url} target="_blank" rel="noopener" className="operator-msg-att">📎 {p.name || 'pièce jointe'}</a>
                ) : (
                  <span key={i} className="operator-msg-att">📎 {p.name || 'pièce jointe'}</span>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {!closed && demande.statut === 'ouverte' ? (
        <p className="operator-wait-note">L’équipe du projet vous répondra dans les meilleurs délais — vous serez notifié par e-mail et SMS.</p>
      ) : null}

      {!closed ? (
        <section className="operator-card operator-replybox">
          <form action={repondreAssistanceAction}>
            <input type="hidden" name="documentId" value={documentId} />
            <textarea name="corps" rows={3} placeholder="Votre réponse…" className="operator-demform-input" />
            <div className="operator-reply-actions">
              <label className="operator-secondary-btn operator-btn-sm">
                📎 Joindre un fichier
                <input type="file" name="piece" hidden accept=".pdf,image/*" />
              </label>
              <button type="submit" className="operator-primary-btn operator-btn-sm">Envoyer</button>
            </div>
          </form>
          <div className="operator-resolve-line">
            <OperatorResolveButton documentId={documentId} />
          </div>
        </section>
      ) : (
        <div className="operator-closed-note">
          Cette demande est close et ne peut pas être rouverte.
          <Link href="/assistance/nouvelle" className="operator-primary-btn operator-btn-sm">+ Nouvelle demande</Link>
        </div>
      )}
    </div>
  );
}

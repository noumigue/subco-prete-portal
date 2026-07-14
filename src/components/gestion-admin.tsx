'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { GestionAdminCompte, GestionAdminJournal, GestionAdminJournalFilters } from '@/lib/portal-types';
import {
  inviterCompteAction,
  renvoyerInvitationAction,
  desactiverCompteAction,
  reactiverCompteAction,
  changerRoleCompteAction,
  fetchAdminJournalAction,
  exportJournalCsvAction,
} from '@/app/(gestion)/actions';

type Tab = 'comptes' | 'journal' | 'params' | 'secu';
const TABS: [Tab, string][] = [
  ['comptes', 'Comptes internes'],
  ['journal', 'Journal des actes'],
  ['params', 'Paramètres & référentiels'],
  ['secu', 'Sécurité'],
];

const ROLES: [string, string][] = [['instructeur', 'instructeur'], ['ugp', 'ugp'], ['comite', 'comite']];

// L4 — annuaire (où change-t-on X ?). Aide à la navigation, pas une donnée métier :
// l'admin Strapi reste l'éditeur ; cet écran oriente, il ne duplique aucun formulaire.
const REFS: [string, string, string][] = [
  ['Provinces & communes', 'Cascade territoriale (réforme 2025 : 5 provinces / 42 communes) — M3, profils, back-office', 'Référentiels'],
  ['Filières', '5 filières prioritaires + projet transversal — cartes publiques, M3, filtres S&E', 'Référentiels'],
  ['Types d’infrastructure', 'Exemples de référence de l’info-bulle M3 (champ libre, jamais un menu fermé)', 'Référentiels'],
  ['Types de contrepartie', 'Numéraire / nature / mixte — M3 étape 3, contrôle ≥ 20 %', 'Référentiels'],
  ['Statuts de site & niveaux de maturité', 'Listes M3 étape 2', 'Référentiels'],
  ['Cohortes / appels (AAP)', 'Fenêtres de candidature, dates, cohorte pilote', 'Appels'],
  ['Types de documents (Annexe 9)', 'Les 18 pièces par slot — M3 étape 4, complétude Annexe 11', 'Référentiels'],
  ['Barème d’évaluation', 'Blocs A/B, pondérations, bonus, seuils de bande — arbitrage E1 réversible', 'Barème'],
  ['Paramètres du Comité', 'Quorum (placeholder 5/7), nombre de membres', 'Paramètres'],
  ['Paramètres de décaissement', 'Délai indicatif de traitement (§11.5, à confirmer)', 'Paramètres'],
  ['Catégories d’assistance', 'Ma candidature / Ma subvention / Problème technique / Autre', 'Référentiels'],
  ['Cas de non-objection', 'Les 9 cas 6.7.1 a–i — liste adaptable', 'Référentiels'],
  ['Indicateurs S&E', '17 indicateurs, 5 familles 14.3, mode calculé/saisi, cibles éditables', 'Référentiels'],
  ['Contenus éditoriaux', 'FAQ (dont canaux MGP), documents téléchargeables, bandes du site public', 'Contenus CMS'],
];

const SECU: [string, string, string, 'on' | 'def', string][] = [
  ['🔑', 'Politique de mot de passe (comptes internes)', 'Longueur minimale imposée à la définition du mot de passe (invitation & renouvellement).', 'on', 'En place'],
  ['🛡️', 'MFA sur la porte interne', 'Différé au pilote (décision B1 confirmée). Provision posée — activation à décider avec l’UGP.', 'def', 'Différé — à confirmer UGP'],
  ['🗝️', 'Super admin Strapi', 'Couche technique hors applicatif : 1–2 détenteurs maximum, adossés à admin@subco-prete.bi. Jamais utilisé pour les actes métier (les actes passent par les comptes applicatifs, journalisés).', 'on', 'Discipline infra'],
  ['🧾', 'Journal append-only jusqu’à la base (L3-bis)', 'Trigger PostgreSQL refusant UPDATE/DELETE sur la table du journal — le panneau Strapi lui-même ne peut pas altérer un acte. Seule reste la voie base directe, réservée à l’infra.', 'on', 'En place (trigger)'],
  ['💾', 'Sauvegardes & disponibilité', 'Sauvegardes PostgreSQL + médias : responsabilité infra (§14.10 « sauvegarde des informations, disponibilité des archives »).', 'def', 'À la charge infra'],
  ['✉️', 'Délivrabilité des e-mails', 'SPF / DKIM / DMARC sur subco-prete.bi ; reply-to noreply@ → contact@ ; bounces → admin@ (section 22 de la fiche).', 'def', 'À configurer'],
];

function initials(nom: string) {
  const parts = nom.split(/[\s.]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'SP';
}

function statutPill(s: GestionAdminCompte['statut']) {
  if (s === 'actif') return <span className="gx-pill gx-m7-pill-actif">Actif</span>;
  if (s === 'desactive') return <span className="gx-pill gx-m7-pill-off">Désactivé</span>;
  return <span className="gx-pill gx-m7-pill-inv">Invitation envoyée</span>;
}

export function GestionAdmin({
  role, isAdmin, tab: initialTab, comptes, journal, strapiAdminUrl,
}: {
  role: 'ugp' | 'instructeur';
  isAdmin: boolean;
  tab: string;
  comptes: GestionAdminCompte[] | null;
  journal: GestionAdminJournal | null;
  strapiAdminUrl: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((TABS.some(([k]) => k === initialTab) ? initialTab : 'comptes') as Tab);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  // Comptes
  const [showInvite, setShowInvite] = useState(false);
  const [iNom, setINom] = useState('');
  const [iEmail, setIEmail] = useState('');
  const [iRole, setIRole] = useState('instructeur');
  const [iAdm, setIAdm] = useState(false);
  const [roleEditId, setRoleEditId] = useState<number | null>(null);
  const [roleEditVal, setRoleEditVal] = useState('instructeur');

  // Journal
  const [jState, setJState] = useState<GestionAdminJournal | null>(journal);
  const [filters, setFilters] = useState<GestionAdminJournalFilters>({ periode: '90', page: 1 });

  const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 3400); };
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    setBusy(true);
    startTransition(async () => {
      let r: { ok: boolean; error?: string };
      try { r = await fn(); } catch { r = { ok: false, error: 'Connexion interrompue — rechargez la page.' }; }
      setBusy(false);
      notify(r.ok ? okMsg : (r.error || 'L’action a échoué.'));
    });
  };

  const goTab = (t: Tab) => { setTab(t); router.replace(`/gestion/administration?tab=${t}`); };

  // ——— Journal : rechargement filtré ———
  async function refreshJournal(next: GestionAdminJournalFilters) {
    setFilters(next);
    setBusy(true);
    try {
      const j = await fetchAdminJournalAction(next);
      setJState(j);
    } catch { notify('Chargement du journal interrompu.'); }
    setBusy(false);
  }
  const setFilter = (patch: Partial<GestionAdminJournalFilters>) => refreshJournal({ ...filters, ...patch, page: 1 });

  async function exportCsv() {
    setBusy(true);
    try {
      const r = await exportJournalCsvAction(filters);
      if (r.ok && r.csv != null) {
        const blob = new Blob([r.csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'journal-actes.csv';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        notify('Export CSV téléchargé — l’artefact remis aux auditeurs (hors plateforme).');
      } else notify(r.error || 'L’export a échoué.');
    } catch { notify('L’export a échoué.'); }
    setBusy(false);
  }

  return (
    <div className="gx">
      <h1 className="gx-page-title">Administration</h1>
      <p className="gx-page-sub">
        Comptes internes, journal des actes, paramètres — l’UGP est gardienne des accès et des archives (§3.9, §9.5, §14.10).
      </p>

      <div className="gx-subtabs">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" className={`gx-subtab${tab === k ? ' on' : ''}`} onClick={() => goTab(k)}>{l}</button>
        ))}
      </div>

      {/* ——— Comptes internes (L1/L2) ——— */}
      {tab === 'comptes' && (
        !isAdmin ? (
          <div className="gx-m7-lock">🔒 La gestion des comptes internes est réservée aux comptes porteurs du drapeau <b>adminComptes</b> (L1, contrôle serveur). Votre compte {role === 'ugp' ? 'UGP' : 'Cabinet'} accède {role === 'ugp' ? 'au journal, aux paramètres et à la sécurité' : "à l’annuaire des paramètres et à la sécurité"}.</div>
        ) : (
          <>
            <div className="gx-card">
              <div className="gx-block-title">Comptes internes
                <span className="gx-m7-r">{(comptes || []).filter((c) => c.statut === 'actif').length} actifs · {(comptes || []).filter((c) => c.statut === 'desactive').length} désactivé · {(comptes || []).filter((c) => c.statut === 'invitation').length} invitation</span>
              </div>
              {(comptes || []).map((c) => (
                <div className="gx-m7-urow" key={c.id}>
                  <span className={`gx-m7-uav ${c.role || ''}`}>{initials(c.nom)}</span>
                  <span className="gx-m7-um">
                    <span className="gx-m7-un">{c.nom} {c.adminComptes && <span className="gx-m7-admtag">adminComptes</span>}</span>
                    <span className="gx-m7-ue">{c.email}</span>
                  </span>
                  <span className={`gx-m7-rolebadge rb-${c.role}`}>{c.role}</span>
                  {statutPill(c.statut)}
                  <span className="gx-m7-uacts">
                    {c.statut === 'actif' && roleEditId !== c.id && (
                      <>
                        <button className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={() => { setRoleEditId(c.id); setRoleEditVal(c.role || 'instructeur'); }}>Changer de rôle</button>
                        <button className="gx-btn gx-btn-danger gx-btn-sm" disabled={busy} onClick={() => run(() => desactiverCompteAction(c.id), 'Compte désactivé — connexion bloquée, historique conservé (jamais de suppression).')}>Désactiver</button>
                      </>
                    )}
                    {c.statut === 'actif' && roleEditId === c.id && (
                      <span className="gx-m7-roleedit">
                        <select value={roleEditVal} onChange={(e) => setRoleEditVal(e.target.value)}>
                          {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <button className="gx-btn gx-btn-primary gx-btn-sm" disabled={busy || roleEditVal === c.role} onClick={() => { setRoleEditId(null); run(() => changerRoleCompteAction(c.id, roleEditVal), `Rôle modifié → ${roleEditVal} (acte journalisé).`); }}>Enregistrer</button>
                        <button className="gx-btn gx-btn-ghost gx-btn-sm" onClick={() => setRoleEditId(null)}>Annuler</button>
                      </span>
                    )}
                    {c.statut === 'desactive' && (
                      <button className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={() => run(() => reactiverCompteAction(c.id), 'Compte réactivé (acte journalisé).')}>Réactiver</button>
                    )}
                    {c.statut === 'invitation' && (
                      <button className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={() => run(() => renvoyerInvitationAction(c.id), `Invitation renvoyée à ${c.email}.`)}>Renvoyer l’invitation</button>
                    )}
                  </span>
                </div>
              ))}
              <div className="gx-actions">
                {!showInvite && <button className="gx-btn gx-btn-primary gx-btn-sm" onClick={() => setShowInvite(true)}>+ Inviter un compte</button>}
              </div>
            </div>

            {showInvite && (
              <div className="gx-card">
                <div className="gx-block-title">Inviter un compte interne</div>
                <div className="gx-m7-grid3">
                  <div><label className="gx-m7-lbl">Nom complet</label><input type="text" value={iNom} onChange={(e) => setINom(e.target.value)} placeholder="Prénom Nom" /></div>
                  <div><label className="gx-m7-lbl">E-mail professionnel</label><input type="email" value={iEmail} onChange={(e) => setIEmail(e.target.value)} placeholder="prenom.nom@…" /></div>
                  <div><label className="gx-m7-lbl">Rôle</label><select value={iRole} onChange={(e) => setIRole(e.target.value)}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                </div>
                <label className="gx-chk"><input type="checkbox" checked={iAdm} onChange={(e) => setIAdm(e.target.checked)} /> Drapeau adminComptes (gestion des comptes)</label>
                <div className="gx-actions">
                  <button className="gx-btn gx-btn-primary" disabled={busy} onClick={() => {
                    const nom = iNom.trim(); const email = iEmail.trim();
                    if (!nom || !email) { notify('Nom et e-mail requis.'); return; }
                    run(() => inviterCompteAction({ nom, email, role: iRole, adminComptes: iAdm }).then((r) => {
                      if (r.ok) { setShowInvite(false); setINom(''); setIEmail(''); setIRole('instructeur'); setIAdm(false); }
                      return r;
                    }), `Invitation envoyée à ${email} — lien de définition du mot de passe (acte journalisé).`);
                  }}>Envoyer l’invitation</button>
                  <button className="gx-btn gx-btn-ghost" onClick={() => setShowInvite(false)}>Annuler</button>
                </div>
                <p className="gx-m7-hint">L’invité reçoit un e-mail avec un lien pour <b>définir son mot de passe</b> — aucun mot de passe ne circule en clair (L2).</p>
              </div>
            )}

            <p className="gx-annot"><b>L1</b> — cet écran n’est visible que des porteurs du drapeau <code>adminComptes</code> (contrôle serveur, pas seulement UI). <b>L2</b> — création par invitation ; <b>désactivation, jamais suppression</b> (le journal référence ses auteurs à vie, §3.9) ; changement de rôle tracé ; rôle unique par compte. Les comptes opérateurs sont hors périmètre (self-service). Chaque acte d’administration est <b>journalisé</b>.</p>
          </>
        )
      )}

      {/* ——— Journal des actes (L3) ——— */}
      {tab === 'journal' && (
        role !== 'ugp' || !jState ? (
          <div className="gx-m7-lock">🔒 Le journal transverse des actes est réservé à l’UGP (L3). En tant que Cabinet, vous consultez déjà le journal dossier par dossier depuis l’instruction.</div>
        ) : (
          <>
            <div className="gx-filters">
              Période <select value={filters.periode || '90'} onChange={(e) => setFilter({ periode: e.target.value })}>
                <option value="90">90 derniers jours</option>
                <option value="30">30 jours</option>
                <option value="tout">Tout</option>
              </select>
              Type <select value={filters.type || 'tous'} onChange={(e) => setFilter({ type: e.target.value })}>
                <option value="tous">Tous</option>
                <option value="instr">Instruction</option>
                <option value="eval">Évaluation</option>
                <option value="dec">Décision</option>
                <option value="subv">Subvention</option>
                <option value="assist">Assistance</option>
                <option value="adm">Administration</option>
              </select>
              Acteur <select value={filters.acteur || ''} onChange={(e) => setFilter({ acteur: e.target.value })}>
                <option value="">Tous</option>
                {jState.acteurs.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
              Dossier <input type="text" placeholder="PRETE-…" defaultValue={filters.dossier || ''} onKeyDown={(e) => { if (e.key === 'Enter') setFilter({ dossier: (e.target as HTMLInputElement).value }); }} style={{ width: 150 }} />
              <button className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy} onClick={exportCsv} style={{ marginLeft: 'auto' }}>⤓ Export CSV</button>
            </div>
            <div className="gx-card" style={{ padding: '10px 14px' }}>
              <div className="gx-m7-jwrap">
                <table className="gx-m7-jtbl">
                  <thead><tr><th>Date</th><th>Acteur</th><th>Type</th><th>Acte</th><th>Référence</th></tr></thead>
                  <tbody>
                    {jState.data.length === 0 && <tr><td colSpan={5} className="gx-m7-empty">Aucun acte pour ces filtres.</td></tr>}
                    {jState.data.map((j, i) => (
                      <tr key={i}>
                        <td className="gx-m7-jd">{formatDate(j.date)}</td>
                        <td>{j.acteur}<br /><span className="gx-m7-jr">{j.role}</span></td>
                        <td><span className={`gx-m7-ttag tt-${j.cat}`}>{j.typeLabel}</span></td>
                        <td>{j.acte}</td>
                        <td className="gx-m7-jn">{j.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {jState.meta.total > jState.meta.pageSize && (
                <div className="gx-m7-pager">
                  <button className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy || jState.meta.page <= 1} onClick={() => refreshJournal({ ...filters, page: jState.meta.page - 1 })}>← Précédent</button>
                  <span>Page {jState.meta.page} / {Math.ceil(jState.meta.total / jState.meta.pageSize)} · {jState.meta.total} actes</span>
                  <button className="gx-btn gx-btn-ghost gx-btn-sm" disabled={busy || jState.meta.page >= Math.ceil(jState.meta.total / jState.meta.pageSize)} onClick={() => refreshJournal({ ...filters, page: jState.meta.page + 1 })}>Suivant →</button>
                </div>
              )}
            </div>
            <p className="gx-annot"><b>L3</b> — la vue transverse du journal <code>acte-dossier</code> (jusqu’ici consultable dossier par dossier) : filtres période / type / acteur / dossier + <b>export CSV</b> pour audits et supervision (§9.5, §14.10) — les auditeurs restent hors plateforme et reçoivent l’export. <b>L3-bis</b> — append-only garanti <b>jusqu’à la base</b> : un trigger PostgreSQL refuse UPDATE/DELETE sur la table du journal, même depuis le panneau Strapi (super admin compris).</p>
          </>
        )
      )}

      {/* ——— Paramètres & référentiels (L4) ——— */}
      {tab === 'params' && (
        <>
          <div className="gx-card">
            <div className="gx-block-title">Annuaire des référentiels &amp; paramètres <span className="gx-m7-r">l’admin Strapi reste l’éditeur — cet écran oriente, il ne duplique pas</span></div>
            {REFS.map(([n, d, w], i) => (
              <div className="gx-m7-rrow" key={i}>
                <span className="gx-m7-rn">{n}</span>
                <span className="gx-m7-rd">{d}<br /><span className="gx-m7-rw">{w}</span></span>
                <a className="gx-btn gx-btn-ghost gx-btn-sm" href={`${strapiAdminUrl}/content-manager`} target="_blank" rel="noopener noreferrer">Éditer dans Strapi ↗</a>
              </div>
            ))}
          </div>
          <div className="gx-card">
            <div className="gx-block-title">Constantes de code (non éditables en CMS)</div>
            <div className="gx-m7-codebox">
              <b>HELP_DESTINATION</b> = &quot;C&quot; &nbsp;<span className="gx-m7-cmt">{'// « Besoin d’aide ? » → mini-panneau FAQ + assistance (A6)'}</span><br />
              <b>LANG_TOGGLE_ENABLED</b> = false &nbsp;<span className="gx-m7-cmt">{'// toggle FR/KI masqué tant que le Kirundi n’est pas opérationnel (§17)'}</span>
            </div>
            <p className="gx-m7-hint">Modifiables par déploiement uniquement — documentées ici pour que l’équipe sache qu’elles existent et où elles vivent.</p>
          </div>
          <p className="gx-annot"><b>L4</b> — zéro écran d’édition en double : chaque liste est éditée là où elle vit (Strapi), sans redéploiement. Cet annuaire répond à la question « où change-t-on X ? » — la doctrine « rien en dur » rendue visible.</p>
        </>
      )}

      {/* ——— Sécurité (L5) ——— */}
      {tab === 'secu' && (
        <>
          <div className="gx-card">
            <div className="gx-block-title">État &amp; rappels de sécurité</div>
            {SECU.map(([ic, n, m, s, l], i) => (
              <div className="gx-m7-sec" key={i}>
                <span className="gx-m7-si">{ic}</span>
                <span className="gx-m7-st">
                  <span className="gx-m7-sn">{n}</span> <span className={`gx-m7-stag ${s}`}>{l}</span>
                  <br /><span className="gx-m7-sm">{m}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="gx-annot"><b>L5</b> — page informative (aucune action) : elle rend visibles les garanties en place et les décisions différées, pour que rien ne soit implicite. <b>B4 maintenu</b> : pas de rôle Banque mondiale — son accès aux archives passe par les exports remis officiellement (journal CSV, rapports de synthèse, paquets de non-objection).</p>
        </>
      )}

      {toast && <div className="gx-toast show">{toast}</div>}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

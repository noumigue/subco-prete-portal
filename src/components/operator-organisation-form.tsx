'use client';

import { useMemo, useState } from 'react';
import type { PortalFiliere, PortalOrganisation, PortalProvince, PortalStatutJuridique } from '@/lib/portal-types';
import { remapProvinceName } from '@/lib/portal-provinces';
import { saveOrganisationAction } from '@/app/(operator)/actions';

type Props = {
  organisation: PortalOrganisation;
  provinces: PortalProvince[];
  statutJuridiques: PortalStatutJuridique[];
  filieres: PortalFiliere[];
};

export function OperatorOrganisationForm({ organisation, provinces, statutJuridiques, filieres }: Props) {
  // Garde-fou remap (1.4) : la province stockee est remappee a la lecture ; on n'ecrit
  // jamais une valeur perimee — le select est initialise sur la province ACTUELLE.
  const initial = useMemo(() => {
    const { current, wasRemapped } = remapProvinceName(provinces, organisation.province?.nom);
    const province = provinces.find((item) => item.nom === current) || null;
    const commune = province?.communes?.find((item) => item.nom === organisation.commune?.nom) || null;
    return { provinceId: province?.documentId || '', communeId: commune?.documentId || '', wasRemapped };
  }, [provinces, organisation]);

  const [nom, setNom] = useState(organisation.nom || '');
  const [statutJuridiqueId, setStatutJuridiqueId] = useState(
    statutJuridiques.find((item) => item.libelle === organisation.statutJuridique?.libelle)?.documentId || '',
  );
  const [filierePrincipaleId, setFilierePrincipaleId] = useState(
    filieres.find((item) => item.nom === organisation.filierePrincipale?.nom)?.documentId || '',
  );
  const [provinceId, setProvinceId] = useState(initial.provinceId);
  const [communeId, setCommuneId] = useState(initial.communeId);
  const [adresse, setAdresse] = useState(organisation.adresse || '');
  const [contact, setContact] = useState(organisation.contact || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(
    initial.wasRemapped
      ? { kind: 'ok', text: 'Votre province a été mise à jour vers le découpage actuel. Enregistrez pour confirmer.' }
      : null,
  );

  const communes = provinces.find((item) => item.documentId === provinceId)?.communes || [];

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveOrganisationAction({
      nom,
      contact,
      adresse,
      statutJuridiqueId: statutJuridiqueId || null,
      filierePrincipaleId: filierePrincipaleId || null,
      provinceId: provinceId || null,
      communeId: communeId || null,
    });
    setSaving(false);
    setMessage(result.ok ? { kind: 'ok', text: 'Modifications enregistrées.' } : { kind: 'error', text: result.error || 'Échec.' });
  }

  return (
    <section className="operator-card">
      <div className="operator-block-title">Identité</div>
      <div className="operator-form-field">
        <label>Nom de l’organisation</label>
        <input type="text" value={nom} onChange={(event) => setNom(event.target.value)} />
      </div>
      <div className="operator-form-grid">
        <div className="operator-form-field">
          <label>Statut juridique</label>
          <select value={statutJuridiqueId} onChange={(event) => setStatutJuridiqueId(event.target.value)}>
            <option value="">Sélectionner…</option>
            {statutJuridiques.map((item) => <option key={item.documentId} value={item.documentId}>{item.libelle}</option>)}
          </select>
        </div>
        <div className="operator-form-field">
          <label>Filière principale</label>
          <select value={filierePrincipaleId} onChange={(event) => setFilierePrincipaleId(event.target.value)}>
            <option value="">Sélectionner…</option>
            {filieres.map((item) => <option key={item.documentId} value={item.documentId}>{item.nom}</option>)}
          </select>
        </div>
      </div>

      <div className="operator-block-title">Siège</div>
      <div className="operator-form-grid">
        <div className="operator-form-field">
          <label>Province</label>
          <select value={provinceId} onChange={(event) => { setProvinceId(event.target.value); setCommuneId(''); }}>
            <option value="">Sélectionner une province…</option>
            {provinces.map((item) => <option key={item.documentId} value={item.documentId}>{item.nom}</option>)}
          </select>
        </div>
        <div className="operator-form-field">
          <label>Commune</label>
          <select value={communeId} onChange={(event) => setCommuneId(event.target.value)} disabled={!provinceId}>
            <option value="">{provinceId ? 'Sélectionner une commune…' : 'Choisir une province d’abord'}</option>
            {communes.map((item) => <option key={item.documentId} value={item.documentId}>{item.nom}</option>)}
          </select>
        </div>
      </div>
      <div className="operator-form-field">
        <label>Adresse</label>
        <input type="text" value={adresse} onChange={(event) => setAdresse(event.target.value)} placeholder="Colline, zone…" />
      </div>

      <div className="operator-block-title">Personne de contact</div>
      <div className="operator-form-field">
        <label>Nom du responsable</label>
        <input type="text" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Prénom et nom" />
      </div>

      <div className="operator-form-actions">
        <button type="button" className="operator-primary-btn inline" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <span className="operator-field-note">
          Les modifications s’appliquent à vos prochaines candidatures ; les dossiers déjà soumis restent inchangés.
        </span>
      </div>
      {message ? <p className={message.kind === 'ok' ? 'operator-auth-note' : 'operator-auth-error'}>{message.text}</p> : null}
    </section>
  );
}

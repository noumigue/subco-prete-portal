'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  disabled: boolean;
  targetCohort?: string | null;
};

type SubmitState = 'idle' | 'submitting' | 'success';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';
const RESET_DELAY_MS = 4100;
const ERROR_DELAY_MS = 2000;

function formatCohortLabel(value?: string | null) {
  if (!value) return 'prochaine cohorte';
  const match = value.match(/cohorte-(\d+)/i);
  return match ? `Cohorte ${match[1]}` : value;
}

export default function HomeNotificationBand({ disabled, targetCohort }: Props) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = () => {
    setEmail('');
    setConsent(false);
    setSubmitState('idle');
    setErrorMessage('');
    setShowError(false);
    setProgressWidth(100);
  };

  const clearTimers = () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (submitState !== 'success') return;

    setProgressWidth(100);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setProgressWidth(0));
    });

    resetTimerRef.current = setTimeout(() => {
      resetForm();
    }, RESET_DELAY_MS);

    return () => cancelAnimationFrame(frame);
  }, [submitState]);

  const showInlineError = (message: string) => {
    setErrorMessage(message);
    setShowError(true);

    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setShowError(false);
    }, ERROR_DELAY_MS);
  };

  const validate = () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!validEmail || !consent) {
      showInlineError('Veuillez saisir un email valide et accepter les conditions.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (disabled || submitState === 'submitting') return;
    if (!validate()) return;

    clearTimers();
    setSubmitState('submitting');
    setShowError(false);
    setErrorMessage('');

    try {
      const response = await fetch(`${STRAPI_URL}/api/notification-amis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            email: email.trim(),
            consentement: true,
            cohorte_cible: targetCohort || null,
            statut_notif: 'en-attente',
          },
        }),
      });

      if (response.ok) {
        setSubmitState('success');
        return;
      }

      if (response.status === 409) {
        setSubmitState('idle');
        showInlineError('Vous êtes déjà inscrit pour cette cohorte.');
        return;
      }

      if (response.status === 400) {
        setSubmitState('idle');
        showInlineError('Veuillez saisir un email valide et accepter les conditions.');
        return;
      }

      setSubmitState('idle');
      showInlineError('Une erreur est survenue, réessayez plus tard.');
    } catch {
      setSubmitState('idle');
      showInlineError('Une erreur est survenue, réessayez plus tard.');
    }
  };

  return (
    <section id="home-notification-band" className={`section section-band band-notify${disabled ? ' is-disabled' : ''}`}>
      <div className="container">
        <div className="notify-shell">
          <div className="notify-copy">
            <h2 className="notify-title">Être notifié à l&apos;ouverture du prochain AMI</h2>
            <p className="notify-subtitle">
              Aucun appel à propositions n&apos;est ouvert actuellement. Laissez votre email
              {' '}—
              {' '}nous vous alertons dès que le prochain AMI est publié.
            </p>
          </div>

          <div className="notify-card-wrap">
            {submitState === 'success' ? (
              <div className="notify-card notify-confirmation" aria-live="polite">
                <span className="notify-confirmation-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <p className="notify-confirmation-title">Inscription enregistrée</p>
                  <p className="notify-confirmation-text">
                    Nous vous préviendrons dès l&apos;ouverture du prochain AMI
                    {targetCohort ? ` (${formatCohortLabel(targetCohort)})` : ''}.
                  </p>
                  <button type="button" className="notify-reset-link" onClick={resetForm}>
                    Utiliser un autre email
                  </button>
                </div>
                <div className="notify-progress">
                  <span className="notify-progress-fill" style={{ width: `${progressWidth}%` }} />
                </div>
              </div>
            ) : (
              <div className="notify-card">
                <div className="notify-input-row">
                  <input
                    className={`notify-email-input${showError ? ' is-error' : ''}`}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="votre@email.com"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleSubmit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="notify-submit-btn"
                    onClick={() => void handleSubmit()}
                    disabled={submitState === 'submitting'}
                  >
                    {submitState === 'submitting' ? '...' : "M'alerter →"}
                  </button>
                </div>

                <p className={`notify-error-message${showError ? ' is-visible' : ''}`}>{errorMessage}</p>

                <label className="notify-consent-row">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span className="notify-consent-box" aria-hidden="true" />
                  <span className="notify-consent-label">
                    J&apos;accepte de recevoir des notifications sur les appels à propositions SUBCO-PRETE
                  </span>
                </label>

                <p className="notify-privacy-note">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Votre email ne sera utilisé qu&apos;à cette fin. Désinscription à tout moment.
                </p>
              </div>
            )}

            <div className="notify-overlay">
              <div className="notify-overlay-pill">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4l16 16" />
                  <rect x="2" y="7" width="20" height="13" rx="3" />
                </svg>
                <span>
                  Les candidatures sont ouvertes
                  {' '}—
                  {' '}
                  <a href="#home-call-band">Candidatez directement →</a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

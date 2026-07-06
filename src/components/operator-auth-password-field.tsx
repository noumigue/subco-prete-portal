'use client';

import { useState } from 'react';

type OperatorAuthPasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
};

export function OperatorAuthPasswordField({
  id,
  name,
  label,
  hint,
  placeholder,
  minLength,
  required,
}: OperatorAuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="operator-auth-field-block">
      <label htmlFor={id}>
        {label}
        {hint ? <span className="operator-auth-hint"> — {hint}</span> : null}
      </label>
      <div className="operator-auth-field">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          minLength={minLength}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          className="operator-auth-eye"
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );
}

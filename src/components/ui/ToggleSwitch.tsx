import React from 'react';

export interface ToggleSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Reusable Design System Toggle Switch Component
 * 마크업과 CSS가 깔끔하게 분리된 범용 UI 토글 스위치 컴포넌트
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  onChange,
  label,
  icon,
  title,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={title}
      onClick={() => !disabled && onChange(!checked)}
      className={`ds-toggle-switch ds-toggle-switch-${size} ${checked ? 'is-checked' : ''} ${className}`.trim()}
    >
      {icon && <span className="ds-toggle-switch-icon">{icon}</span>}
      {label && <span className="ds-toggle-switch-label">{label}</span>}
      <span className="ds-toggle-switch-track">
        <span className="ds-toggle-switch-thumb" />
      </span>
    </button>
  );
};

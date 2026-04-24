import { forwardRef } from 'react';

export const Input = forwardRef(({ id, label, type = 'text', ...props }, ref) => {
  return (
    <div className="enterprise-form-group">
      <label htmlFor={id} className="enterprise-form-label">
        {label}
      </label>
      <input id={id} type={type} ref={ref} {...props} className="enterprise-form-input" />
    </div>
  );
});

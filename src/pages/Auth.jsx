import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [fields, setFields] = useState({
    identifier: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setFieldErrors({});
    setApiError('');
    navigate(nextMode === 'register' ? '/register' : '/login', { replace: true });
  }

  function updateField(name, value) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const errors = {};
    if (mode === 'login') {
      if (!fields.identifier.trim()) errors.identifier = 'Username or email is required';
      if (!fields.password) errors.password = 'Password is required';
    } else {
      if (!fields.username.trim()) errors.username = 'Username is required';
      if (!fields.email.trim()) {
        errors.email = 'Email is required';
      } else if (!EMAIL_RE.test(fields.email.trim())) {
        errors.email = 'Enter a valid email address';
      }
      if (!fields.password) errors.password = 'Password is required';
      if (fields.password && fields.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (fields.confirmPassword !== fields.password) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ identifier: fields.identifier.trim(), password: fields.password });
      } else {
        await register({
          username: fields.username.trim(),
          email: fields.email.trim(),
          password: fields.password,
        });
      }
      navigate('/');
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && (
            <p className="form-error" role="alert">
              {apiError}
            </p>
          )}

          {mode === 'login' ? (
            <>
              <label className="field">
                <span>Username or email</span>
                <input
                  type="text"
                  value={fields.identifier}
                  onChange={(e) => updateField('identifier', e.target.value)}
                  autoComplete="username"
                />
                {fieldErrors.identifier && <span className="field-error">{fieldErrors.identifier}</span>}
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={fields.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  autoComplete="current-password"
                />
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </label>
            </>
          ) : (
            <>
              <label className="field">
                <span>Username</span>
                <input
                  type="text"
                  value={fields.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  autoComplete="username"
                />
                {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={fields.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  autoComplete="email"
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={fields.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  autoComplete="new-password"
                />
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input
                  type="password"
                  value={fields.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
                {fieldErrors.confirmPassword && (
                  <span className="field-error">{fieldErrors.confirmPassword}</span>
                )}
              </label>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

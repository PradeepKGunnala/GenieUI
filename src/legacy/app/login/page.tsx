'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@/compat/navigation';
import { useEffect, useState } from 'react';

import { api, AUTH_BASE, ControlPlaneError } from '@/lib/api';
import type { Me } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // The XSRF-TOKEN cookie is only minted on GET requests — warm it on mount
  // or the first-ever login submit hits the CSRF check with no cookie (403).
  useEffect(() => {
    api.get<Me>(`${AUTH_BASE}/me`).catch(() => {
      /* 401 expected when signed out — the CSRF cookie is still set */
    });
  }, []);

  const login = useMutation({
    mutationFn: () =>
      api.post<Me>(`${AUTH_BASE}/login`, { username, password }),
    onSuccess: () => router.replace('/dashboard'),
  });

  const error = login.error as ControlPlaneError | null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        className="card w-full max-w-sm space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <h1 className="text-lg font-semibold text-slate-100">
          Genie Control Plane
        </h1>
        <p className="text-sm text-slate-400">
          Owner and viewer sign-in. All privileged actions are audited.
        </p>

        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error.status === 429
              ? 'Too many attempts — try again in a few minutes.'
              : error.message}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full justify-center"
          disabled={login.isPending}
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}


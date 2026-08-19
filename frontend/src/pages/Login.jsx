import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await api.post('/token/', { username, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    navigate('/dashboard');
  } catch (err) {
    if (!err.response) {
      setError('Cannot reach server. Is the backend running?');
    } else if (err.response.status === 401) {
      setError('Invalid username or password');
    } else if (err.response.status === 404) {
      setError('Login endpoint not found — check backend URL configuration');
    } else {
      setError('Something went wrong. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <Link to="/" className="inline-block mb-4 text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
          Login to VaultSecure
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Username
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600">
              <User size={16} className="text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent text-slate-900 outline-none dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600">
              <Lock size={16} className="text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-slate-900 outline-none dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          Register
          </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, KeyRound, FileCheck, ArrowLeft } from 'lucide-react';

const measures = [
  {
    icon: Lock,
    title: 'Encryption at rest',
    description:
      'Every file is encrypted with Fernet before it is stored. Nothing is ever saved as plain text on the server or in storage.',
  },
  {
    icon: KeyRound,
    title: 'Token-based authentication',
    description:
      'Access is controlled with short-lived JWT tokens. Sessions refresh automatically without ever exposing long-lived credentials.',
  },
  {
    icon: ShieldCheck,
    title: 'Strict document ownership',
    description:
      'Every document request is checked against the logged-in user. You can only ever see, download, or delete files you own.',
  },
  {
    icon: FileCheck,
    title: 'Upload validation',
    description:
      'Files are checked for type and size (up to 30MB) before they are accepted, reducing the risk of unsafe uploads.',
  },
];

export default function Security() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <h1 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">
        How VaultSecure protects your documents
      </h1>
      <p className="mb-10 max-w-2xl text-slate-600 dark:text-slate-300">
        A straightforward look at what happens to your files, from upload to storage.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {measures.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Icon size={20} />
            </div>
            <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
        ))}
      </div>

      <Link
        to="/login"
        className="mt-10 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Open vault
      </Link>
    </main>
  );
}
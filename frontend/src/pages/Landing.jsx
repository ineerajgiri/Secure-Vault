import React from 'react';
import { ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <section className="vault-hero">
        <div className="vault-copy">
          <div className="eyebrow">
            <Sparkles size={14} />
            Built for privacy
          </div>

          <h1>
            Protect every document
            <span>inside a digital vault.</span>
          </h1>

          <p>
            VaultSecure keeps your files encrypted, permission-based, and always within
            your control — from upload to access.
          </p>

          <div className="cta-row">
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate('/login')}
            >
              Open vault
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate('/security')}
            >
              View security
            </button>
          </div>

          <div className="feature-row">
            <div className="feature-pill">
              <ShieldCheck size={16} />
              Encrypted storage
            </div>
            <div className="feature-pill">
              <Lock size={16} />
              Access control
            </div>
          </div>
        </div>

        <div className="vault-visual" aria-label="3D vault preview">
          <div className="vault-scene">
            <div className="vault-orbit orbit-one" />
            <div className="vault-orbit orbit-two" />
            <div className="vault-core">
              <div className="vault-face face-front">
                <ShieldCheck size={36} />
              </div>
              <div className="vault-face face-side" />
              <div className="vault-face face-top" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
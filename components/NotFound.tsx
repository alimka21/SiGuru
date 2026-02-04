
import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 p-4">
      <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">sentiment_dissatisfied</span>
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
      <p className="text-lg mb-6">Halaman yang Anda cari tidak ditemukan.</p>
      <Link to="/dashboard" className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-blue-600 transition-colors">
        Kembali ke Dashboard
      </Link>
    </div>
  );
};

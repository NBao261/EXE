import Header from '../components/Header';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Cài đặt</h1>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <p className="text-slate-500">Chức năng đang được phát triển...</p>
        </div>
      </main>
    </div>
  );
}

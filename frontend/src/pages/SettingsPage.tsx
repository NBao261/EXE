import Header from "../components/Header";
import { useLanguageStore } from "../stores/languageStore";

export default function SettingsPage() {
  const { t } = useLanguageStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          {t("header.settings")}
        </h1>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            {t("common.loading")}
          </p>
        </div>
      </main>
    </div>
  );
}

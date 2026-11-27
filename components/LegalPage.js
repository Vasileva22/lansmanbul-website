import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

// Общая обёртка для юридических страниц (единый вид и дата обновления)
export const H2 = ({ children }) => <h2 className="text-lg font-bold text-slate-900 pt-4">{children}</h2>;
export const UL = ({ children }) => <ul className="list-disc pl-6 space-y-2">{children}</ul>;

export default function LegalPage({ title, description, updated, children }) {
  return (
    <>
      <Head>
        <title>{`${title} | lansmanbul.com`}</title>
        <meta name="description" content={description} />
      </Head>
      <Header setFilters={() => {}} />
      <main className="bg-slate-50 min-h-screen pt-28 pb-16 text-slate-800 antialiased font-mulish">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-2 uppercase tracking-wide">{title}</h1>
            <p className="text-xs text-slate-400 mb-8">Son güncelleme: {updated}</p>
            <div className="space-y-5 text-sm md:text-base leading-relaxed text-slate-600">{children}</div>
          </div>
        </div>
      </main>
      <Footer setFilters={() => {}} />
    </>
  );
}

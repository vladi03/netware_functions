import { Link } from 'react-router-dom';
import { articles } from '../data/articles';

function ArticlesIndexPage() {
  return (
    <section className="space-y-8">
      <header className="rounded-2xl border border-blue-100 bg-gradient-to-r from-sky-800 to-blue-700 px-6 py-10 text-white shadow-lg">
        <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-100">
          Article Collection
        </p>
        <h2 className="text-3xl font-semibold">Writing and review library</h2>
      </header>

      <div className="grid gap-5">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="group rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-blue-700">
              {article.published} · {article.readingMinutes}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              {article.title}
            </h3>
            <p className="mt-2 text-sm text-slate-500">By {article.author}</p>
            <p className="mt-4 leading-relaxed text-slate-700">
              {article.abstract}
            </p>
            <Link
              to={`/article/${article.slug}`}
              className="mt-5 inline-flex items-center gap-2 font-medium text-sky-700 transition-colors hover:text-sky-900"
            >
              Read article
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ArticlesIndexPage;

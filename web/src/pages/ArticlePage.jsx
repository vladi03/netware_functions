import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getArticleBySlug } from '../data/articles';

function ArticlePage() {
  const { slug } = useParams();
  const article = getArticleBySlug(slug);
  const audioRef = useRef(null);
  const blockRefs = useRef([]);
  const lastScrolledIndexRef = useRef(-1);
  const [audioDuration, setAudioDuration] = useState(0);
  const [activeBlockIndex, setActiveBlockIndex] = useState(-1);

  const blocks = useMemo(
    () =>
      article
        ? article.body
            .split(/\r?\n+/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              if (line.startsWith('## ')) {
                return { type: 'heading', text: line.slice(3).trim() };
              }
              if (line.startsWith('- ')) {
                return { type: 'bullet', text: line.slice(2).trim() };
              }
              if (/^\[\d+\]\s+/.test(line)) {
                return { type: 'footnote', text: line };
              }
              return { type: 'paragraph', text: line };
            })
        : [],
    [article]
  );

  const blockTiming = useMemo(() => {
    if (!blocks.length || !audioDuration) {
      return [];
    }

    const weights = blocks.map((block) => Math.max(block.text.length, 1));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    let elapsed = 0;

    return weights.map((weight) => {
      const start = elapsed;
      const duration = (weight / totalWeight) * audioDuration;
      elapsed += duration;
      return { start, end: elapsed };
    });
  }, [blocks, audioDuration]);

  const findActiveBlock = (currentTime) => {
    if (!blockTiming.length) {
      return -1;
    }

    for (let index = 0; index < blockTiming.length; index += 1) {
      const window = blockTiming[index];
      if (currentTime >= window.start && currentTime < window.end) {
        return index;
      }
    }

    return blockTiming.length - 1;
  };

  const handleAudioLoadedMetadata = () => {
    if (!audioRef.current) {
      return;
    }
    setAudioDuration(audioRef.current.duration || 0);
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) {
      return;
    }
    const nextIndex = findActiveBlock(audioRef.current.currentTime || 0);
    setActiveBlockIndex(nextIndex);
  };

  const handleAudioEnded = () => {
    setActiveBlockIndex(-1);
  };

  useEffect(() => {
    if (activeBlockIndex < 0) {
      return;
    }

    if (lastScrolledIndexRef.current === activeBlockIndex) {
      return;
    }

    const element = blockRefs.current[activeBlockIndex];
    if (!element) {
      return;
    }

    lastScrolledIndexRef.current = activeBlockIndex;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeBlockIndex]);

  useEffect(() => {
    setActiveBlockIndex(-1);
    setAudioDuration(0);
    lastScrolledIndexRef.current = -1;
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [slug]);

  if (!article) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white p-8 text-slate-800">
        <h1 className="text-3xl font-semibold text-slate-900">Article not found</h1>
        <p className="mt-4 text-slate-600">
          The article you are looking for is not available.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sky-700 hover:text-sky-900"
        >
          Back to index
        </Link>
      </section>
    );
  }

  return (
    <article className="space-y-8">
      <header className="rounded-2xl bg-slate-900 px-6 py-10 text-slate-50">
        <p className="mb-2 text-sm uppercase tracking-wide text-sky-200">
          {article.published} | {article.readingMinutes}
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{article.title}</h1>
        <p className="mt-2 text-slate-200">By {article.author}</p>
      </header>

      {article.audioSrc ? (
        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Audio Narration</h2>

          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
            <audio
              ref={audioRef}
              controls
              preload="auto"
              className="w-full"
              src={article.audioSrc}
              onLoadedMetadata={handleAudioLoadedMetadata}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={handleAudioEnded}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        </section>
      ) : null}

      <div className="space-y-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        {activeBlockIndex >= 0 ? (
          <div className="sticky top-3 z-10 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sky-800 shadow-sm">
            Now reading section {activeBlockIndex + 1} of {blocks.length}
          </div>
        ) : null}

        {blocks.map((block, index) => {
          const isActive = index === activeBlockIndex;
          const stateClass = isActive
            ? 'border-sky-500 bg-sky-200/70 text-slate-900 shadow-sm'
            : 'border-transparent bg-white text-slate-700';
          const sharedProps = {
            key: `${article.slug}-${index}`,
            ref: (element) => {
              blockRefs.current[index] = element;
            },
            className: `rounded-md border-l-4 px-3 py-2 transition-all duration-200 ${stateClass}`,
          };

          if (block.type === 'heading') {
            return (
              <h2 {...sharedProps} className={`${sharedProps.className} text-2xl font-semibold`}>
                {block.text}
              </h2>
            );
          }

          if (block.type === 'bullet') {
            return (
              <p {...sharedProps} className={`${sharedProps.className} leading-relaxed`}>
                {'• '}
                {block.text}
              </p>
            );
          }

          if (block.type === 'footnote') {
            return (
              <p {...sharedProps} className={`${sharedProps.className} text-sm leading-relaxed text-slate-600`}>
                {block.text}
              </p>
            );
          }

          return (
            <p {...sharedProps} className={`${sharedProps.className} leading-relaxed`}>
              {block.text}
            </p>
          );
        })}
      </div>

      <Link to="/" className="inline-flex items-center text-sm font-medium text-sky-700">
        Return to article index
      </Link>
    </article>
  );
}

export default ArticlePage;

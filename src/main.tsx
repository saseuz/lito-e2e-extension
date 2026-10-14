import { useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, ArrowRight, BookOpen, ExternalLink, FileText, LoaderCircle, Moon, Search, SearchX, Star, Sun, Volume2, X } from 'lucide-react';
import type { LookupData } from './contract';
import './style.css';

type State = { kind: 'idle' | 'loading' } | { kind: 'error' | 'missing'; message: string } | { kind: 'success'; data: LookupData };
const selection = new URLSearchParams(window.location.hash.slice(1));
const selectedWord = selection.get('word') || '';
const invalidSelection = selection.has('selectionError') || selectedWord.length > 255;
// The selection lives only in this popup's memory after initialization.
if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
function safeLink(value: string | null) {
  if (!value) return undefined;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
function App() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<'meanings' | 'examples' | 'source'>('meanings');
  const [word, setWord] = useState(invalidSelection ? '' : selectedWord);
  const [state, setState] = useState<State>(invalidSelection
    ? { kind: 'error', message: 'Select a word or short phrase (up to 255 characters).' }
    : { kind: 'idle' });
  useEffect(() => {
    if (selectedWord && !invalidSelection) void lookup(selectedWord);
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    void lookup(word);
  }
  async function lookup(searchWord: string) {
    setTab('meanings');
    setState({ kind: 'loading' });
    try {
      const url = new URL(import.meta.env.VITE_API_URL);
      url.searchParams.set('word', searchWord.trim()); url.searchParams.set('language', 'en');
      const response = await fetch(url, { credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (response.status === 404) { setState({ kind: 'missing', message: 'No dictionary entry found. Check the spelling and try again.' }); return; }
      if (!response.ok) {
        const message = response.status === 429 ? 'Too many searches. Please wait a minute.' : response.status === 422 ? 'Enter a valid English word.' : 'Provider failed or the dictionary is unavailable. Please try again.';
        setState({ kind: 'error', message }); return;
      }
      const body = await response.json();
      if (!body.data || !Array.isArray(body.data.meanings) || !body.data.source) throw new Error('Invalid API response');
      setState({ kind: 'success', data: body.data as LookupData });
    } catch { setState({ kind: 'error', message: 'Cannot reach the dictionary. Check your connection and API server.' }); }
  }
  const data = state.kind === 'success' ? state.data : null;
  const examples = data?.meanings.flatMap(m => m.senses.flatMap(s => s.examples)) ?? [];
  const count = data?.meanings.reduce((total, m) => total + m.senses.length, 0) ?? 0;
  return <main className={dark ? 'dark' : ''}>
    <header><div className="brand-block"><img className="brand-logo" src="./branding/lito-dictionary-wide.png" alt="Lito Dictionary" width="2172" height="724" /><p className="tagline">A word worth knowing.</p></div><button type="button" className="theme icon-button" aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={() => setDark(!dark)}>{dark ? <Sun size={21} /> : <Moon size={21} />}</button></header>
    <form onSubmit={submit}><label className="sr-only" htmlFor="word">English word</label><div className="search"><Search aria-hidden="true" size={20} /><input id="word" value={word} onChange={e => setWord(e.target.value)} placeholder="Search an English word" required maxLength={255} autoFocus />{word && <button type="button" className="clear icon-button" aria-label="Clear search" onClick={() => setWord('')}><X size={18} /></button>}<button className="submit" aria-label="Look up word" disabled={state.kind === 'loading'}><ArrowRight size={28} /></button></div></form>
    <section aria-live="polite" aria-busy={state.kind === 'loading'}>
      {state.kind === 'idle' && <div className="welcome"><h1>Search an English word</h1><p>Get clear meanings, pronunciation, and examples<br/>from trusted sources.</p><div className="features">{[[BookOpen, 'Definitions', 'Clear and simple meanings'], [Volume2, 'Pronunciation', 'Hear how it’s said'], [FileText, 'Examples', 'Words in context'], [Star, 'Trusted sources', 'Reputable dictionaries']].map(([Icon, title, detail]) => <div key={title as string}><span className="feature-icon" aria-hidden="true"><Icon size={27} /></span><strong>{title as string}</strong><small>{detail as string}</small></div>)}</div><BookArt/><p className="availability">Pronunciation and examples appear when available.</p></div>}
      {state.kind === 'loading' && <div className="message"><LoaderCircle className="spinner" size={32} aria-hidden="true"/><h2>Finding your word…</h2><p>A little more understanding, coming up.</p></div>}
      {(state.kind === 'error' || state.kind === 'missing') && <div className="message" role={state.kind === 'error' ? 'alert' : 'status'}>{state.kind === 'missing' ? <SearchX className="message-icon" size={35} /> : <AlertCircle className="message-icon" size={35} />}<h2>{state.kind === 'missing' ? 'No entry found' : 'Unable to look up this word'}</h2><p>{state.message}</p></div>}
      {data && <>
        <div className="heading"><h2>{data.word}</h2><span className="badge">{[...new Set(data.meanings.map(m => m.part_of_speech))].join(' · ')}</span></div>
        {data.meanings.flatMap(m => m.pronunciations).map((sound, i) => <div className="sound" key={i}><span>{sound.text}</span>{safeLink(sound.audio_url) && <audio aria-label={`Pronunciation of ${data.word}`} controls preload="none" src={safeLink(sound.audio_url)} />}</div>)}
        <nav className="tabs" aria-label="Dictionary sections">{(['meanings', 'examples', 'source'] as const).map(t => <button key={t} type="button" aria-pressed={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t === 'meanings' ? `Meanings (${count})` : t === 'examples' ? `Examples (${examples.length})` : 'Source'}</button>)}</nav>
        <div className="result-panel">
          {tab === 'meanings' && data.meanings.map((meaning, i) => <article key={i}>{data.meanings.length > 1 && <h3>{meaning.part_of_speech}</h3>}<ol>{meaning.senses.map((sense, j) => <li key={j}><span className="number">{j + 1}</span><div>{sense.definitions.map((text, k) => <p key={k}>{text}</p>)}{sense.examples.map((example, k) => <blockquote key={k}>{example.text}</blockquote>)}</div></li>)}</ol></article>)}
          {tab === 'examples' && (examples.length ? examples.map((example, i) => <blockquote key={i}>{example.text}{example.attribution && <small>{example.attribution} <a href={safeLink(example.license_url)} target="_blank" rel="noreferrer">{example.license}</a></small>}</blockquote>) : <p className="empty">No examples supplied for this word.</p>)}
          {tab === 'source' && <div className="source-detail"><h3>{data.source.name}</h3><p>{data.source.attribution}</p><a href={safeLink(data.source.license_url)} target="_blank" rel="noreferrer">{data.source.license} ↗</a></div>}
        </div>
        <footer>{data.source.name.startsWith('Merriam-Webster') && <img src="./merriam-webster.png" width="50" height="50" alt="Merriam-Webster"/>}<div><a href={safeLink(data.source.url)} target="_blank" rel="noreferrer">{data.source.name} <ExternalLink size={11} aria-hidden="true" /></a><p>{data.source.attribution}</p></div></footer>
      </>}
    </section>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);

function BookArt() {
  return <svg className="book-art" aria-hidden="true" viewBox="0 0 400 170" fill="none"><ellipse cx="205" cy="143" rx="173" ry="18" fill="#e9dfce"/><path d="M80 134C39 57 85 20 132 25c66 7 108-33 169 3 34 21 64 68 35 106" fill="#f0e9de"/><path d="M91 134c8-33 3-66-19-94" stroke="#638369" strokeWidth="3"/><path d="M82 75C50 69 51 44 49 30c26 7 39 19 33 45m10 25c-6-30 8-49 23-57 3 25-2 44-23 57" fill="#809b7d"/><path d="m113 110 53-26 164 10q20 2 18 44l-52 16-178-13Z" fill="#155643"/><path d="m123 115 173 12v21l-173-13Z" fill="#eedcaa"/><path d="m123 123 173 11m-173-3 173 10" stroke="#cfbd8e"/><path d="m146 72 48-26 128 5q18 7 9 48l-42 20-143-14Z" fill="#37715a"/><path d="m153 78 131 12v21l-131-13Z" fill="#f5e5b9"/><path d="m153 87 131 10m-131-3 131 10" stroke="#d5c395"/><path d="m146 72 143 15 40-26M113 110l184 14 46-18" stroke="#8ba48a" strokeWidth="4"/><path d="m304 113 4 31m-6-85-5 48" stroke="#c8ab63" strokeWidth="2"/></svg>;
}

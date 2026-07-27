import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSearch, IconCornerDownLeft } from '@tabler/icons-react';
import { StatusBadge } from '../ui/Badge';
import { api } from '../../api/client';

export function CommandBar() {
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const nav = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [isMac] = useState(() =>
    /Mac|iPhone|iPad/.test(navigator.platform)
  );

  // Cmd/Ctrl + K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { results: r } = await api.get(
          `/api/search?q=${encodeURIComponent(trimmed)}&project_id=1`
        );

        setResults(r || []);
        setCursor(0);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Outside click
  useEffect(() => {
    function onClick(e) {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleKey(e) {
    if (!open || !results.length) {
      if (e.key === 'Escape') {
        setQuery('');
        setResults([]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = results[cursor];

      if (pick) {
        setOpen(false);
        setQuery('');
        setResults([]);
        nav('/projects/1');
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setResults([]);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-[440px]">
      <div
        className="group flex items-center gap-2 h-9 px-3 rounded-card transition
          border border-ink-100 dark:border-white/10
          bg-ink-50/70 dark:bg-white/[0.04]
          hover:bg-ink-50 dark:hover:bg-white/[0.06]
          focus-within:bg-white dark:focus-within:bg-[#1c1c1f]
          focus-within:border-accent/60 focus-within:shadow-focus"
      >
        <IconSearch
          size={14}
          stroke={1.7}
          className="text-ink-400 shrink-0"
        />

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            const value = e.target.value;

            setQuery(value);

            if (value.trim().length < 2) {
              setResults([]);
              setOpen(false);
              setCursor(0);
            }
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Search tasks, projects, or commands…"
          className="flex-1 bg-transparent outline-none text-[13px] placeholder-ink-400
            text-ink-950 dark:text-white"
        />

        <span
          className="font-mono text-[10px] text-ink-400 px-1.5 h-[18px]
          inline-flex items-center rounded border border-ink-100
          dark:border-white/10 bg-white dark:bg-white/[0.06]
          group-focus-within:opacity-0 transition"
        >
          {isMac ? '⌘K' : 'Ctrl K'}
        </span>
      </div>

      {/* Keep the rest of your JSX exactly as it is */}
    </div>
  );
}

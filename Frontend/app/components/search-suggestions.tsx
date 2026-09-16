"use client";

import { useEffect, useId, useState, type RefObject } from "react";
import { MapPin, Search } from "lucide-react";
import { api } from "../../lib/api";

type Props = {
  field: "title" | "location";
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  shortcut?: boolean;
};

export default function SearchSuggestions({ field, label, placeholder, value, onChange, inputRef, shortcut }: Props) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState<{ query: string; rows: string[] }>({ query: "", rows: [] });
  const [active, setActive] = useState(-1);
  const query = value.trim();

  useEffect(() => {
    if (!focused || !open || query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ field, q: query });
      api<string[]>("/jobs/suggestions?" + params, { signal: controller.signal })
        .then(rows => { if (!controller.signal.aborted) setResult({ query, rows }); })
        .catch(() => { if (!controller.signal.aborted) setResult({ query, rows: [] }); });
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [field, focused, open, query]);

  const suggestions = result.query === query ? result.rows : [];
  const visible = focused && open && query.length >= 2 && suggestions.length > 0;
  const choose = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
    setActive(-1);
  };

  return <div className="search-combobox" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setActive(-1); }
  }}>
    <label className="search-box">
      {field === "title" ? <Search size={21} aria-hidden /> : <MapPin size={20} aria-hidden />}
      <span className="sr-only">{label}</span>
      <input suppressHydrationWarning ref={inputRef} role="combobox" aria-autocomplete="list"
        aria-expanded={visible} aria-controls={id} aria-activedescendant={visible && active >= 0 ? `${id}-option-${active}` : undefined}
        placeholder={placeholder} maxLength={200} value={value}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onChange={event => { onChange(event.target.value); setActive(-1); setOpen(true); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setOpen(false); setActive(-1); }
          if (!visible) return;
          if (event.key === "ArrowDown") { event.preventDefault(); setActive(index => (index + 1) % suggestions.length); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => index <= 0 ? suggestions.length - 1 : index - 1); }
          if (event.key === "Enter" && active >= 0) { event.preventDefault(); choose(suggestions[active]); }
        }} />
      {shortcut && <kbd aria-hidden>/</kbd>}
    </label>
    {visible && <div className="search-suggestions" id={id} role="listbox" aria-label={`${label} suggestions`}>
      {suggestions.map((suggestion, index) => <button type="button" role="option" aria-selected={active === index}
        id={`${id}-option-${index}`} key={suggestion} onMouseDown={event => event.preventDefault()}
        onClick={() => choose(suggestion)} className={active === index ? "active" : ""}>{suggestion}</button>)}
    </div>}
  </div>;
}

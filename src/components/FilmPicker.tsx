'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { FILM_DATABASE } from '@/lib/films';
import { FilmStock, FilmType, FilmFormat } from '@/lib/types';

interface FilmPickerProps {
  filmType: FilmType;
  filmFormat: FilmFormat;
  onSelectFilm: (filmKey: string) => void;
  onCancel: () => void;
}

export function FilmPicker({ filmType, filmFormat, onSelectFilm, onCancel }: FilmPickerProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter films by type, format, and search
  const filteredFilms = useMemo(() => {
    const typeFilter = filmType === 'color' ? 'color_negative' : 'bw_negative';

    return Object.entries(FILM_DATABASE)
      .filter(([, film]) => {
        // Filter by type
        if (film.type !== typeFilter) return false;
        // Filter by format
        if (!film.formats.includes(filmFormat)) return false;
        // Filter by search
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            film.name.toLowerCase().includes(searchLower) ||
            film.brand.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by brand, then by ISO
        if (a[1].brand !== b[1].brand) {
          return a[1].brand.localeCompare(b[1].brand);
        }
        return a[1].iso - b[1].iso;
      });
  }, [filmType, filmFormat, search]);

  // Group films by brand
  const groupedFilms = useMemo(() => {
    const groups: Record<string, Array<[string, FilmStock]>> = {};
    for (const entry of filteredFilms) {
      const brand = entry[1].brand;
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(entry);
    }
    return groups;
  }, [filteredFilms]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="film-picker">
      <div className="film-picker-header">
        <h2 className="film-picker-title">Select Your Film</h2>
        <button onClick={onCancel} className="film-picker-close" aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="film-picker-search">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search films..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="film-picker-input"
          enterKeyHint="search"
        />
      </div>

      <div className="film-picker-info">
        Showing {filmType === 'color' ? 'colour' : 'B&W'} films for {filmFormat}
      </div>

      <div className="film-picker-list">
        {Object.entries(groupedFilms).map(([brand, films]) => (
          <div key={brand} className="film-picker-group">
            <div className="film-picker-brand">{brand}</div>
            {films.map(([key, film]) => (
              <button
                key={key}
                className="film-picker-item"
                onClick={() => onSelectFilm(key)}
              >
                <span className="film-picker-item-name">{film.name}</span>
                <span className="film-picker-item-iso">ISO {film.iso}</span>
              </button>
            ))}
          </div>
        ))}

        {filteredFilms.length === 0 && (
          <div className="film-picker-empty">
            No films found matching &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  );
}

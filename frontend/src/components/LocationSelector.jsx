/**
 * HeatShield AI - Location Selector Component
 * Searchable dropdown for selecting Indian cities.
 */

import React, { useState, useRef, useEffect } from 'react';

export default function LocationSelector({ cities, selectedCity, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(search.toLowerCase())
    );

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12]
                   border border-white/10 hover:border-white/20 transition-all duration-200
                   text-sm font-medium text-white"
                id="city-selector"
            >
                <span>📍</span>
                <span>{selectedCity}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 z-50 glass-card !p-2 shadow-2xl"
                    style={{ backdropFilter: 'blur(24px)' }}>
                    {/* Search input */}
                    <div className="relative mb-2">
                        <input
                            type="text"
                            placeholder="Search city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg
                         text-sm text-white placeholder-gray-500 outline-none
                         focus:border-orange-500/50 transition-colors"
                            autoFocus
                            id="city-search-input"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                    </div>

                    {/* City list */}
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                        {filteredCities.map(city => (
                            <button
                                key={city}
                                onClick={() => { onSelect(city); setIsOpen(false); setSearch(''); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${city === selectedCity
                                        ? 'bg-orange-500/20 text-orange-400 font-semibold'
                                        : 'text-gray-300 hover:bg-white/[0.06]'
                                    }`}
                                id={`city-option-${city.toLowerCase()}`}
                            >
                                📍 {city}
                            </button>
                        ))}
                        {filteredCities.length === 0 && (
                            <div className="text-center text-gray-500 py-3 text-sm">No cities found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

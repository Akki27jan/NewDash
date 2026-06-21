"use client";

import React, { useState, useEffect } from 'react';
import { useTheme, CustomColors, PresetTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme, customColors, setCustomColors } = useTheme();

  // Local state for the custom builder before applying
  const [builderColors, setBuilderColors] = useState<CustomColors>(customColors);
  const [successMsg, setSuccessMsg] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [modalError, setModalError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync local builder state when context changes (if changed elsewhere)
  useEffect(() => {
    setBuilderColors(customColors);
  }, [customColors]);

  const handleColorChange = (key: keyof CustomColors, value: string) => {
    setBuilderColors(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyCustomTheme = () => {
    setCustomColors(builderColors);
    setTheme('custom');
    setSuccessMsg('[SUCCESS] Custom theme activated and saved to local storage.');
  };

  const handleApplyPreset = (preset: PresetTheme) => {
    setTheme(preset);
    setSuccessMsg(`[SUCCESS] ${preset.toUpperCase()} theme activated.`);
  };

  const exportPayload = JSON.stringify(builderColors, null, 2);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportPayload)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => setModalError('[ERROR] Failed to copy to clipboard.'));
  };

  const handleValidateAndImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.bg || !parsed.primary) {
        throw new Error('Invalid theme payload format.');
      }

      const mergedColors = { ...builderColors, ...parsed };

      setBuilderColors(mergedColors);
      setCustomColors(mergedColors);
      setTheme('custom');

      setShowImportModal(false);
      setImportText('');
      setModalError('');
      setSuccessMsg('[SUCCESS] Theme imported and applied successfully.');
    } catch (err: any) {
      setModalError('[ERROR] ' + (err.message || 'Invalid JSON payload.'));
    }
  };

  const colorFields: { key: keyof CustomColors, label: string }[] = [
    { key: 'bg', label: 'Background' },
    { key: 'primary', label: 'Primary Text' },
    { key: 'secondary', label: 'Secondary Text' },
    { key: 'muted', label: 'Muted Text' },
    { key: 'border', label: 'Borders' },
    { key: 'borderBg', label: 'Border Background (rgba/hex)' },
    { key: 'accent', label: 'Accent / Danger' },
    { key: 'accentBg', label: 'Accent Background (rgba/hex)' },
    { key: 'success', label: 'Success' },
    { key: 'successBg', label: 'Success Background (rgba/hex)' },
    { key: 'warning', label: 'Warning / Yellow' },
  ];

  return (
    <main className="flex-grow flex flex-col gap-8 w-full max-w-5xl mx-auto px-4 mt-8 mb-8">
      {/* Page Title */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h1 className="text-theme-primary font-bold text-2xl mb-4 border-b border-theme-border pb-2">
          <span className="text-theme-accent">{user ? `${user.first_name}_${user.last_name}@newdash` : 'root@newdash'}</span>:~/settings# _
        </h1>
        <p className="text-theme-secondary mb-2">
          Configure system preferences and custom terminal themes.
        </p>
      </div>

      {successMsg && (
        <div className="text-theme-success text-sm bg-theme-success-bg p-2 border border-theme-success">
          {successMsg}
        </div>
      )}

      {/* PRESET THEMES */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold text-xl mb-4 border-b border-theme-border pb-2 flex items-center justify-between">
          <div><span className="text-theme-accent mr-2">&gt;</span> [PRESET_THEMES]</div>
          {theme !== 'custom' && <span className="text-theme-success text-sm">[{theme.toUpperCase()}_ACTIVE]</span>}
        </h2>

        <div className="flex flex-wrap gap-4 mt-4">
          <button
            onClick={() => handleApplyPreset('default')}
            className={`px-4 py-2 border ${theme === 'default' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ DEFAULT_BLUE ]
          </button>
          <button
            onClick={() => handleApplyPreset('matrix')}
            className={`px-4 py-2 border ${theme === 'matrix' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ MATRIX_GREEN ]
          </button>
          <button
            onClick={() => handleApplyPreset('cyberpink')}
            className={`px-4 py-2 border ${theme === 'cyberpink' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ CYBERPINK_NEON ]
          </button>
          <button
            onClick={() => handleApplyPreset('catppuccin')}
            className={`px-4 py-2 border ${theme === 'catppuccin' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ CATPPUCCIN_MOCHA ]
          </button>
          <button
            onClick={() => handleApplyPreset('tokyo-night')}
            className={`px-4 py-2 border ${theme === 'tokyo-night' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ TOKYO_NIGHT ]
          </button>
          <button
            onClick={() => handleApplyPreset('osaka-jade')}
            className={`px-4 py-2 border ${theme === 'osaka-jade' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ OSAKA_JADE ]
          </button>
          <button
            onClick={() => handleApplyPreset('nord')}
            className={`px-4 py-2 border ${theme === 'nord' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ NORD_DARK ]
          </button>
          <button
            onClick={() => handleApplyPreset('matte-black')}
            className={`px-4 py-2 border ${theme === 'matte-black' ? 'border-theme-primary text-theme-primary bg-theme-border-bg' : 'border-theme-border text-theme-secondary hover:border-theme-primary'}`}
          >
            [ MATTE_BLACK ]
          </button>
        </div>
      </div>

      {/* CUSTOM THEME BUILDER */}
      <div className="border border-theme-border p-6 bg-theme-bg">
        <h2 className="text-theme-primary font-bold text-xl mb-4 border-b border-theme-border pb-2 flex items-center justify-between">
          <div><span className="text-theme-accent mr-2">&gt;</span> [CUSTOM_THEME_BUILDER]</div>
          {theme === 'custom' && <span className="text-theme-success text-sm">[ACTIVE]</span>}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {colorFields.map(field => (
            <div key={field.key} className="flex flex-col gap-2">
              <label className="text-theme-secondary text-sm">&gt; {field.label}:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={builderColors[field.key].length === 7 ? builderColors[field.key] : '#000000'}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  className="w-10 h-10 border border-theme-border bg-theme-bg cursor-pointer"
                  title="Color Picker"
                />
                <input
                  type="text"
                  value={builderColors[field.key]}
                  onChange={(e) => handleColorChange(field.key, e.target.value)}
                  className="bg-transparent border border-theme-border text-theme-primary p-1 flex-1 focus:outline-none focus:border-theme-accent font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => { setShowImportModal(true); setModalError(''); setImportText(''); }}
            className="border border-theme-border text-theme-secondary hover:text-theme-primary px-4 py-2 focus:outline-none focus:ring-1 focus:ring-theme-primary"
          >
            [IMPORT_THEME]
          </button>
          <button
            onClick={() => { setShowExportModal(true); setModalError(''); setCopySuccess(false); }}
            className="border border-theme-border text-theme-secondary hover:text-theme-primary px-4 py-2 focus:outline-none focus:ring-1 focus:ring-theme-primary"
          >
            [EXPORT_THEME]
          </button>
          <button
            onClick={handleApplyCustomTheme}
            className="border border-theme-success text-theme-success hover:bg-theme-success-bg px-4 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-theme-success"
          >
            [APPLY_CUSTOM_THEME]
          </button>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-theme-bg/90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl border border-theme-border bg-theme-bg flex flex-col shadow-[0_0_20px_rgba(0,0,255,0.15)] font-mono">
            {/* Nano Header */}
            <div className="bg-theme-border text-black px-2 py-1 flex justify-between items-center text-sm font-bold">
              <span>UW PICO 5.09</span>
              <span>File: theme_export.json</span>
              <span></span>
            </div>

            <div className="p-2 border-b border-theme-border/50 text-theme-secondary text-sm">
              &gt; Payload: Read-Only
            </div>

            {/* Text Area */}
            <div className="flex-grow p-2">
              <textarea
                readOnly
                value={exportPayload}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowExportModal(false);
                  }
                }}
                className="w-full h-64 bg-transparent text-theme-primary focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
            </div>

            {/* Nano Footer/Shortcuts */}
            <div className="bg-theme-border/20 text-theme-secondary p-2 text-xs flex flex-wrap gap-x-6 gap-y-2 border-t border-theme-border items-center">
              <div className="flex items-center cursor-pointer hover:text-white" onClick={handleCopyToClipboard}>
                <span className="bg-theme-border text-black px-1 mr-1 font-bold">^O</span> Copy [COPY]
              </div>
              <div className="flex items-center cursor-pointer hover:text-white" onClick={() => setShowExportModal(false)}>
                <span className="bg-theme-border text-black px-1 mr-1 font-bold">ESC</span> Exit [CLOSE]
              </div>
              {copySuccess && <span className="text-theme-success ml-auto">Copied to clipboard!</span>}
              {modalError && <span className="text-theme-accent ml-auto">{modalError}</span>}
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-theme-bg/90 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl border border-theme-border bg-theme-bg flex flex-col shadow-[0_0_20px_rgba(0,0,255,0.15)] font-mono">
            {/* Nano Header */}
            <div className="bg-theme-border text-black px-2 py-1 flex justify-between items-center text-sm font-bold">
              <span>UW PICO 5.09</span>
              <span>File: theme_import.json</span>
              <span>{importText ? 'Modified' : ''}</span>
            </div>

            <div className="p-2 border-b border-theme-border/50 text-theme-secondary text-sm">
              &gt; Action: Paste Theme Payload
            </div>

            {/* Text Area */}
            <div className="flex-grow p-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowImportModal(false);
                  }
                }}
                className="w-full h-64 bg-transparent text-theme-primary focus:outline-none resize-none leading-relaxed"
                placeholder="[ Enter payload here... ]"
                autoFocus
              />
            </div>

            {/* Nano Footer/Shortcuts */}
            <div className="bg-theme-border/20 text-theme-secondary p-2 text-xs flex flex-wrap gap-x-6 gap-y-2 border-t border-theme-border items-center">
              <div className="flex items-center cursor-pointer hover:text-white" onClick={handleValidateAndImport}>
                <span className="bg-theme-border text-black px-1 mr-1 font-bold">^O</span> Write Out [APPLY]
              </div>
              <div className="flex items-center cursor-pointer hover:text-white" onClick={() => setShowImportModal(false)}>
                <span className="bg-theme-border text-black px-1 mr-1 font-bold">ESC</span> Exit [CANCEL]
              </div>
              {modalError && <span className="text-theme-accent ml-auto">{modalError}</span>}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

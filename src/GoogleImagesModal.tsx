import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Globe,
  Link2,
  ImagePlus,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { isContentRestricted, formatModerationWarning } from './moderation';

interface GoogleImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  onUploadFromDevice: () => void;
  onRestrictedQuery: (warning: string) => void;
}

interface SearchImageItem {
  id: string;
  title: string;
  url: string;
  previewUrl?: string;
}

const QUICK_SUGGESTIONS = [
  'Goat',
  'Crown',
  'Potato',
  'Basketball',
  'Sneakers',
  'Gaming Setup',
  'Cat Meme',
  'Sunset',
];

export default function GoogleImagesModal({
  isOpen,
  onClose,
  onSelectImage,
  onUploadFromDevice,
  onRestrictedQuery,
}: GoogleImagesModalProps) {
  const [activeMode, setActiveMode] = useState<'gifs' | 'search' | 'embed' | 'url'>('gifs');
  const [query, setQuery] = useState<string>('Goat');
  const [results, setResults] = useState<SearchImageItem[]>([]);
  const [gifResults, setGifResults] = useState<SearchImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const performGifSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (clean && isContentRestricted(clean)) {
      onRestrictedQuery(formatModerationWarning('GOATS', clean));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/gifs?q=${encodeURIComponent(clean)}`);
      const data = await res.json();
      const rawList: SearchImageItem[] = Array.isArray(data.gifs) ? data.gifs : [];
      const safeList = rawList.filter(
        (item) => !isContentRestricted(item.title) && !isContentRestricted(item.url)
      );
      setGifResults(safeList);
    } catch {
      setGifResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) return;
    if (isContentRestricted(clean)) {
      onRestrictedQuery(formatModerationWarning('GOATS', clean));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/image-search?q=${encodeURIComponent(clean)}`);
      const data = await res.json();
      const rawList: SearchImageItem[] = Array.isArray(data.results) ? data.results : [];
      const safeList = rawList.filter(
        (item) => !isContentRestricted(item.title) && !isContentRestricted(item.url)
      );
      setResults(safeList);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeMode === 'gifs' && gifResults.length === 0) {
        performGifSearch(query);
      } else if (activeMode === 'search' && results.length === 0) {
        performSearch(query);
      }
    }
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeMode === 'gifs') {
      performGifSearch(query);
    } else {
      performSearch(query);
    }
  };

  const handleAttachUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = customImageUrl.trim();
    if (!cleanUrl) return;
    if (
      !cleanUrl.startsWith('https://') &&
      !cleanUrl.startsWith('http://') &&
      !cleanUrl.startsWith('data:image/')
    ) {
      setUrlError('Please paste a valid https:// or data:image/ URL.');
      return;
    }
    onSelectImage(cleanUrl);
    setCustomImageUrl('');
    setUrlError(null);
    onClose();
  };

  const googleEmbedUrl = query.trim()
    ? `https://www.google.com/search?q=${encodeURIComponent(query.trim())}&tbm=isch&igu=1&hl=en&gl=us&lr=lang_en`
    : 'https://images.google.com/?igu=1&hl=en&gl=us';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-images-modal-title"
      className="fixed inset-0 z-50 bg-[#2C2520]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="bg-white border border-[#E5DEC9] rounded-2xl max-w-4xl w-full h-[85vh] max-h-[740px] flex flex-col overflow-hidden shadow-2xl text-[#2C2520]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#FAF8F5] border-b border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] border border-[#DFD7C8] flex items-center justify-center text-[#8C6D46] shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="google-images-modal-title"
                className="font-display text-lg font-bold text-[#2C2520]"
              >
                GIFs, Google Images & Web Photo Hub
              </h2>
              <p className="text-xs text-[#6E645B]">
                Search animated GIFs, browse{' '}
                <span className="font-mono-tabular text-[#2C2520]">https://images.google.com/</span>,
                or paste any image/GIF URL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onUploadFromDevice();
              }}
              className="px-3 py-2 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] border border-[#DFD7C8] text-xs font-semibold text-[#2C2520] flex items-center gap-1.5"
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#8C6D46]" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Google Images modal"
              className="p-2 rounded-xl text-[#786E65] hover:text-[#2C2520] hover:bg-[#EFECE6]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Bar */}
        <div className="px-5 py-2.5 bg-[#F7F4EF] border-b border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveMode('gifs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'gifs'
                  ? 'bg-[#2C2520] text-white'
                  : 'bg-white text-[#5C5349] border border-[#DFD7C8] hover:text-[#2C2520]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Animated GIFs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('search')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'search'
                  ? 'bg-[#2C2520] text-white'
                  : 'bg-white text-[#5C5349] border border-[#DFD7C8] hover:text-[#2C2520]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Web Photos Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('embed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'embed'
                  ? 'bg-[#2C2520] text-white'
                  : 'bg-white text-[#5C5349] border border-[#DFD7C8] hover:text-[#2C2520]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Embedded Google Images (images.google.com)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('url')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeMode === 'url'
                  ? 'bg-[#2C2520] text-white'
                  : 'bg-white text-[#5C5349] border border-[#DFD7C8] hover:text-[#2C2520]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Paste Image / GIF URL</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar (shared by GIFs, Search & Google Embed) */}
        {activeMode !== 'url' && (
          <div className="px-5 py-3 bg-white border-b border-[#EFECE6] space-y-2.5 shrink-0">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C8075] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    activeMode === 'gifs'
                      ? 'Search GIFs (e.g. goat, funny, dance, celebrate)...'
                      : 'Search Google Images (e.g. goat, sigma, crown, sneakers)...'
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold transition-colors shrink-0"
              >
                {activeMode === 'gifs' ? 'Search GIFs' : 'Search Images'}
              </button>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] text-[#786E65] shrink-0">Quick picks:</span>
              {activeMode === 'gifs' && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    performGifSearch('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#2C2520] text-white text-[11px] font-semibold whitespace-nowrap"
                >
                  🔥 Trending GIFs
                </button>
              )}
              {QUICK_SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setQuery(item);
                    if (activeMode === 'gifs') {
                      performGifSearch(item);
                    } else {
                      performSearch(item);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#F7F4EF] hover:bg-[#EFECE6] border border-[#E5DEC9] text-[11px] font-medium text-[#5C5349] hover:text-[#2C2520] whitespace-nowrap"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#FAF8F5] flex flex-col">
          {/* MODE 0: Animated GIFs Grid */}
          {activeMode === 'gifs' && (
            <div className="p-5 flex-1">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#6E645B]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#8C6D46]" />
                  <span className="text-xs font-medium">
                    Loading GIFs{query ? ` for "${query}"` : ''}...
                  </span>
                </div>
              ) : gifResults.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                  <p className="text-sm text-[#5C5349] font-medium mb-1">
                    No GIFs found{query ? ` for "${query}"` : ''}
                  </p>
                  <p className="text-xs text-[#786E65]">
                    Try another keyword or click Trending GIFs above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gifResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectImage(item.url);
                        onClose();
                      }}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-white border border-[#E5DEC9] hover:border-[#2C2520] transition-all flex flex-col"
                    >
                      <img
                        src={item.previewUrl || item.url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#2C2520]/80 text-white text-[10px] font-bold uppercase tracking-wider">
                        GIF
                      </span>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2C2520]/80 via-[#2C2520]/40 to-transparent px-2.5 py-1.5 text-left">
                        <span className="text-[11px] font-medium text-white truncate block">
                          {item.title}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-[#2C2520]/50 flex items-center justify-center p-2">
                        <span className="px-3 py-1.5 rounded-lg bg-white text-[#2C2520] text-xs font-bold flex items-center gap-1 shadow-md">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          Use GIF
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODE 1: Instant Click-to-Send Image Search Grid */}
          {activeMode === 'search' && (
            <div className="p-5 flex-1">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#6E645B]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#8C6D46]" />
                  <span className="text-xs font-medium">Searching web images for "{query}"...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                  <p className="text-sm text-[#5C5349] font-medium mb-1">
                    No images found for "{query}"
                  </p>
                  <p className="text-xs text-[#786E65]">
                    Try another search keyword or switch to the Embedded Google Images tab above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectImage(item.url);
                        onClose();
                      }}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-white border border-[#E5DEC9] hover:border-[#2C2520] transition-all flex flex-col"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2C2520]/80 via-[#2C2520]/40 to-transparent px-2.5 py-1.5 text-left">
                        <span className="text-[11px] font-medium text-white truncate block">
                          {item.title}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-[#2C2520]/50 flex items-center justify-center p-2">
                        <span className="px-3 py-1.5 rounded-lg bg-white text-[#2C2520] text-xs font-bold flex items-center gap-1 shadow-md">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          Use Image
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODE 2: Direct Embedded https://images.google.com/ iframe + Quick Paste Bar */}
          {activeMode === 'embed' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-5 py-2.5 bg-[#EFECE6] border-b border-[#DFD7C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#5C5349]">
                <span>
                  Browsing embedded <strong>https://images.google.com/</strong> — right-click any image to Copy Image / Copy Image Address, then paste it below:
                </span>
              </div>

              <div className="flex-1 bg-white relative min-h-[300px]">
                <iframe
                  src={googleEmbedUrl}
                  title="Embedded Google Images (https://images.google.com/)"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>

              <form
                onSubmit={handleAttachUrl}
                className="p-3.5 bg-white border-t border-[#E5DEC9] flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => {
                    setCustomImageUrl(e.target.value);
                    setUrlError(null);
                  }}
                  placeholder="Paste copied Google Image URL here (https://...) to attach to chat..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] text-xs text-[#2C2520] placeholder-[#9E9388] focus:outline-none focus:border-[#8C6D46]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold shrink-0"
                >
                  Attach Image
                </button>
              </form>
            </div>
          )}

          {/* MODE 3: Paste Direct Image URL */}
          {activeMode === 'url' && (
            <div className="p-6 max-w-xl w-full mx-auto my-auto space-y-4">
              <div className="bg-white border border-[#E5DEC9] rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#2C2520]">
                    Attach Image from Any URL
                  </h3>
                  <p className="text-xs text-[#6E645B] mt-0.5">
                    Paste any direct image link from Google Images or the web
                  </p>
                </div>

                <form onSubmit={handleAttachUrl} className="space-y-3">
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => {
                      setCustomImageUrl(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://example.com/photo.jpg"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] text-xs text-[#2C2520] focus:outline-none focus:border-[#8C6D46]"
                  />
                  {urlError && (
                    <p className="text-xs text-rose-700 font-medium">{urlError}</p>
                  )}

                  {customImageUrl.trim().startsWith('http') && (
                    <div className="p-3 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] flex flex-col items-center">
                      <img
                        src={customImageUrl.trim()}
                        alt="URL Preview"
                        referrerPolicy="no-referrer"
                        className="max-h-44 rounded-lg object-contain"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] text-white text-xs font-semibold"
                    >
                      Attach to Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card } from './components/Card';
import { Zone } from './components/Zone';
import { InputBar } from './components/InputBar';
import type { Card as CardType, ZoneType } from './types';
import './index.css';

const ZONES: { type: ZoneType; title: string; xPercent: number }[] = [
  { type: 'Do', title: 'Do', xPercent: 0.16 },
  { type: 'Someday', title: 'Someday', xPercent: 0.5 },
  { type: 'Forget', title: 'Forget', xPercent: 0.83 },
];

const DRIFT_INTERVAL = 50;
const DRIFT_SPEED = 0.2;
const COOLDOWN_MS = 30000;

function App() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [loaded, setLoaded] = useState(false);
  const driftRef = useRef<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search & Review
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [reviewMode, setReviewMode] = useState(false);

  console.log("App Rendering - Cards count:", cards.length, "Loaded:", loaded);

  // Load data
  useEffect(() => {
    console.log("Loading data...");
    if (window.electronAPI) {
      console.log("Electron API detected");
      window.electronAPI.readUserData()
        .then((data) => {
          console.log("Data received from Electron:", data);
          if (data && Array.isArray(data.cards)) {
            setCards(data.cards);
          }
          setLoaded(true);
        })
        .catch(err => {
          console.error("Failed to load Electron data:", err);
          setLoaded(true);
        });
    } else {
      console.log("No Electron API, using standard browser storage");
      try {
        const local = localStorage.getItem('idea-parking-lot');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            setCards(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load local storage:", err);
      }
      setLoaded(true);
    }
  }, []);

  // Save data
  useEffect(() => {
    if (!loaded) return;
    console.log("Saving data...", cards.length, "cards");
    if (window.electronAPI) {
      window.electronAPI.writeUserData({ cards }).catch(err => console.error("Save error:", err));
    } else {
      localStorage.setItem('idea-parking-lot', JSON.stringify(cards));
    }
  }, [cards, loaded]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          if (window.confirm('Delete selected card?')) {
            setCards(prev => prev.filter(c => c.id !== selectedId));
            setSelectedId(null);
          }
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        if (selectedId) {
          setCards(prev => prev.map(c => c.id === selectedId ? { ...c, pinned: !c.pinned } : c));
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(prev => !prev);
        if (!showSearch) setTimeout(() => document.getElementById('search-input')?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, showSearch]);

  // Drift Logic
  useEffect(() => {
    driftRef.current = window.setInterval(() => {
      setCards(currentCards => {
        const now = Date.now();
        let changed = false;
        const newCards = currentCards.map(card => {
          if (card.pinned) return card;
          if (card.id === activeDragId) return card;
          if (card.lastDraggedAt && now - card.lastDraggedAt < COOLDOWN_MS) return card;

          const createdAt = card.createdAt || now;
          const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
          let targetZoneType: ZoneType = 'Do';
          if (ageDays > 14) targetZoneType = 'Forget';
          else if (ageDays > 2) targetZoneType = 'Someday';

          const width = window.innerWidth || 800;
          const height = window.innerHeight || 600;

          const targetZone = ZONES.find(z => z.type === targetZoneType);
          if (!targetZone) return card;

          const targetX = width * targetZone.xPercent - 96;
          const targetY = height / 2 - 60;

          let dx = targetX - card.x;
          let dy = targetY - card.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 2) return card;

          const moveX = (dx / dist) * DRIFT_SPEED;
          const moveY = (dy / dist) * DRIFT_SPEED;

          if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
            const newX = card.x + moveX;
            const newY = card.y + moveY;
            changed = true;
            return { ...card, x: newX, y: newY };
          }
          return card;
        });
        return changed ? newCards : currentCards;
      });
    }, DRIFT_INTERVAL);

    return () => {
      if (driftRef.current) clearInterval(driftRef.current);
    }
  }, [activeDragId]);

  const addCard = (text: string) => {
    const width = window.innerWidth || 800;
    const height = window.innerHeight || 600;
    const newCard: CardType = {
      id: uuidv4(),
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      zone: 'Someday',
      x: width * 0.5 - 96,
      y: height * 0.5 - 60,
      pinned: false,
    };
    setCards(prev => [...prev, newCard]);
  };

  const handleDragStart = (id: string) => {
    setActiveDragId(id);
    setSelectedId(id);
  };

  const handleDragStop = (id: string, x: number, y: number) => {
    setActiveDragId(null);
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;

      const width = window.innerWidth || 800;
      let newZone: ZoneType = 'Someday';
      if (x + 96 < width * 0.33) newZone = 'Do';
      else if (x + 96 > width * 0.66) newZone = 'Forget';
      else newZone = 'Someday';

      return {
        ...c,
        x,
        y,
        lastDraggedAt: Date.now(),
        zone: newZone,
        updatedAt: Date.now()
      };
    }));
  };

  const filteredCards = (Array.isArray(cards) ? cards : []).filter(c => {
    if (searchText && !c.text.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      className="flex w-full h-full relative bg-gray-900 text-white overflow-hidden"
      onMouseDown={() => setSelectedId(null)}
      style={{ minHeight: '100vh' }}
    >
      <InputBar onAdd={addCard} />

      {/* Search Bar */}
      {showSearch && (
        <div className="search-panel z-50">
          <input
            id="search-input"
            type="text"
            placeholder="Search..."
            className="input-box"
            style={{ width: '12rem' }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Review Mode Toggle */}
      <div className="review-panel z-50" onMouseDown={e => e.stopPropagation()}>
        <button
          onClick={() => setReviewMode(!reviewMode)}
          className={`btn ${reviewMode ? 'btn-yellow' : 'btn-gray'}`}
        >
          {reviewMode ? 'Exit Review' : 'Review Old'}
        </button>
      </div>

      {/* Review Actions */}
      {reviewMode && selectedId && (
        <div className="review-actions z-50" onMouseDown={e => e.stopPropagation()}>
          <button
            onClick={() => {
              setCards(prev => prev.map(c => c.id === selectedId ? { ...c, zone: 'Someday', updatedAt: Date.now(), createdAt: Date.now() } : c));
              setSelectedId(null);
            }}
            className="btn btn-green"
          >
            Keep (Reset)
          </button>
          <button
            onClick={() => {
              setCards(prev => prev.filter(c => c.id !== selectedId));
              setSelectedId(null);
            }}
            className="btn btn-red"
          >
            Delete
          </button>
        </div>
      )}

      {/* Zones Layer */}
      <div className="absolute inset-0 flex z-0">
        {ZONES.map(z => <Zone key={z.type} type={z.type} title={z.title} />)}
      </div>

      {/* Cards Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {filteredCards.map(card => {
          const now = Date.now();
          const createdAt = card.createdAt || now;
          const isOld = (now - createdAt) > 14 * 24 * 60 * 60 * 1000;
          const highlight = reviewMode && isOld;
          const dim = reviewMode && !isOld;

          return (
            <div
              key={card.id}
              className="pointer-events-auto"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transition: 'opacity 0.3s',
                opacity: dim ? 0.2 : 1
              }}
            >
              <Card
                card={card}
                isSelected={selectedId === card.id || highlight}
                onDragStart={() => handleDragStart(card.id)}
                onDragStop={handleDragStop}
                onSelect={() => setSelectedId(card.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;

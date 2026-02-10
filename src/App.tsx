
import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card } from './components/Card';
import { Zone } from './components/Zone';
import { InputBar } from './components/InputBar';
import { Card as CardType, ZoneType } from './types';
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

  // Load data
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.readUserData().then((data) => {
        if (data && data.cards) {
          setCards(data.cards);
        }
        setLoaded(true);
      });
    } else {
      const local = localStorage.getItem('idea-parking-lot');
      if (local) setCards(JSON.parse(local));
      setLoaded(true);
    }
  }, []);

  // Save data
  useEffect(() => {
    if (!loaded) return;
    if (window.electronAPI) {
      window.electronAPI.writeUserData({ cards });
    } else {
      localStorage.setItem('idea-parking-lot', JSON.stringify(cards));
    }
  }, [cards, loaded]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Ignore if typing in input

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          if (confirm('Delete selected card?')) {
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

          const ageDays = (now - card.createdAt) / (1000 * 60 * 60 * 24);
          let targetZoneType: ZoneType = 'Do';
          if (ageDays > 14) targetZoneType = 'Forget';
          else if (ageDays > 2) targetZoneType = 'Someday';

          const width = window.innerWidth;
          const height = window.innerHeight;

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
    const width = window.innerWidth;
    const height = window.innerHeight;
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
    setSelectedId(id); // Select on drag start
  };

  const handleDragStop = (id: string, x: number, y: number) => {
    setActiveDragId(null);
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;

      const width = window.innerWidth;
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

  const filteredCards = cards.filter(c => {
    if (searchText && !c.text.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      className="flex w-full h-full relative bg-gray-900 text-white overflow-hidden"
      onMouseDown={() => setSelectedId(null)} // Deselect on background click
    >
      <InputBar onAdd={addCard} />

      {/* Search Bar */}
      {showSearch && (
        <div className="fixed top-16 right-4 z-50 bg-gray-800 p-2 rounded shadow border border-gray-600">
          <input
            id="search-input"
            type="text"
            placeholder="Search..."
            className="bg-gray-700 text-white p-1 rounded outline-none w-48"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onMouseDown={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Review Mode Toggle */}
      <div className="fixed bottom-4 right-4 z-50" onMouseDown={e => e.stopPropagation()}>
        <button
          onClick={() => setReviewMode(!reviewMode)}
          className={`px-3 py-1 rounded text-sm font-bold ${reviewMode ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
        >
          {reviewMode ? 'Exit Review' : 'Review Old'}
        </button>
      </div>

      {/* Review Actions for Old Cards */}
      {reviewMode && selectedId && (
        <div className="fixed bottom-16 right-4 z-50 flex gap-2" onMouseDown={e => e.stopPropagation()}>
          <button
            onClick={() => {
              // Keep: move to Someday, updated now
              setCards(prev => prev.map(c => c.id === selectedId ? { ...c, zone: 'Someday', updatedAt: Date.now(), createdAt: Date.now() } : c));
              setSelectedId(null);
            }}
            className="bg-green-600 px-3 py-1 rounded shadow hover:bg-green-500"
          >
            Keep (Reset)
          </button>
          <button
            onClick={() => {
              setCards(prev => prev.filter(c => c.id !== selectedId));
              setSelectedId(null);
            }}
            className="bg-red-600 px-3 py-1 rounded shadow hover:bg-red-500"
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
          const isOld = (Date.now() - card.createdAt) > 14 * 24 * 60 * 60 * 1000;
          const highlight = reviewMode && isOld;
          const dim = reviewMode && !isOld; // Dim others in review mode?

          return (
            <div
              key={card.id}
              className={`pointer-events-auto transition-opacity duration-300 ${dim ? 'opacity-20' : 'opacity-100'}`}
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

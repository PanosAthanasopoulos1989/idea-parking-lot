
import React from 'react';
import Draggable from 'react-draggable';
import { Card as CardType } from '../types';

interface CardProps {
    card: CardType;
    isSelected: boolean;
    onDragStop: (id: string, x: number, y: number) => void;
    onDragStart: () => void;
    onSelect: () => void;
}

export const Card: React.FC<CardProps> = ({ card, isSelected, onDragStop, onDragStart, onSelect }) => {
    const nodeRef = React.useRef(null);

    const ageDays = (Date.now() - card.createdAt) / (1000 * 60 * 60 * 24);
    let bgClass = 'bg-gray-700';
    if (ageDays < 2) bgClass = 'bg-blue-900/80 border-blue-500';
    else if (ageDays < 14) bgClass = 'bg-yellow-900/80 border-yellow-500';
    else bgClass = 'bg-red-900/80 border-red-500';

    const selectedClass = isSelected ? 'ring-2 ring-white z-50' : '';

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: card.x, y: card.y }}
            onStart={onDragStart}
            onStop={(e, data) => onDragStop(card.id, data.x, data.y)}
            bounds="parent"
        >
            <div
                ref={nodeRef}
                onMouseDown={(e) => {
                    e.stopPropagation(); // Prevent deselecting when clicking card
                    onSelect();
                }}
                className={`absolute p-4 rounded shadow-lg cursor-grab active:cursor-grabbing border ${bgClass} ${selectedClass} text-white w-48 select-none transition-colors duration-500`}
                style={{ zIndex: isSelected ? 100 : 10 + Math.floor(card.updatedAt / 10000000) % 50 }}
            >
                <div className="text-sm font-medium break-words pointer-events-none">
                    {card.text}
                </div>
                <div className="text-xs text-gray-400 mt-2 pointer-events-none">
                    {new Date(card.createdAt).toLocaleDateString()}
                </div>
                {card.pinned && <div className="absolute top-1 right-1 text-xs text-yellow-400">📌</div>}
            </div>
        </Draggable>
    );
};

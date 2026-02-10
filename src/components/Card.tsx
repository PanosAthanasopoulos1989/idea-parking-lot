
import React from 'react';
import Draggable from 'react-draggable';
import type { Card as CardType } from '../types';

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
    let ageZoneClass = 'card-someday';
    if (ageDays < 2) ageZoneClass = 'card-do';
    else if (ageDays > 14) ageZoneClass = 'card-forget';

    const selectedClass = isSelected ? 'card-selected' : '';

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
                    e.stopPropagation();
                    onSelect();
                }}
                className={`absolute card-container ${ageZoneClass} ${selectedClass}`}
                style={{ zIndex: isSelected ? 100 : 10 }}
            >
                <div className="card-text">
                    {card.text}
                </div>
                <div className="card-date">
                    {new Date(card.createdAt).toLocaleDateString()}
                </div>
                {card.pinned && <div className="card-pin">📌</div>}
            </div>
        </Draggable>
    );
};

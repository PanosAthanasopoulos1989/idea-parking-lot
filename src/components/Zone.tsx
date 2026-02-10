
import React from 'react';
import type { ZoneType } from '../types';

interface ZoneProps {
    type: ZoneType;
    title: string;
}

export const Zone: React.FC<ZoneProps> = ({ type, title }) => {
    let zoneClass = '';
    switch (type) {
        case 'Do': zoneClass = 'zone-do'; break;
        case 'Someday': zoneClass = 'zone-someday'; break;
        case 'Forget': zoneClass = 'zone-forget'; break;
    }

    return (
        <div className={`flex-1 h-full flex flex-col items-center zone ${zoneClass} pointer-events-none select-none`}>
            <h2 className="zone-title">{title}</h2>
        </div>
    );
};

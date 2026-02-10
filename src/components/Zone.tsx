
import React from 'react';
import { ZoneType } from '../types';

interface ZoneProps {
    type: ZoneType;
    title: string;
}

export const Zone: React.FC<ZoneProps> = ({ type, title }) => {
    let colors = '';
    switch (type) {
        case 'Do': colors = 'border-l-4 border-l-blue-500 bg-blue-500/5'; break;
        case 'Someday': colors = 'border-l-4 border-l-yellow-500 bg-yellow-500/5'; break;
        case 'Forget': colors = 'border-l-4 border-l-red-500 bg-red-500/5'; break;
    }

    return (
        <div className={`flex-1 h-full flex flex-col items-center justify-start pt-12 ${colors} pointer-events-none select-none`}>
            <h2 className="text-2xl font-bold opacity-30 uppercase tracking-widest">{title}</h2>
        </div>
    );
};


import React, { useState } from 'react';

interface InputBarProps {
    onAdd: (text: string) => void;
}

export const InputBar: React.FC<InputBarProps> = ({ onAdd }) => {
    const [text, setText] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && text.trim()) {
            onAdd(text.trim());
            setText('');
        }
    };

    return (
        <div className="fixed top-0 left-0 w-full p-4 z-50 flex justify-center pointer-events-none">
            <input
                type="text"
                className="w-1/2 p-3 rounded shadow-xl bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none pointer-events-auto transition-all opacity-80 hover:opacity-100 focus:opacity-100"
                placeholder="Type an idea and press Enter..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};

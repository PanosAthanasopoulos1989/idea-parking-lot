
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
        <div className="fixed input-container w-full z-50 pointer-events-none">
            <input
                type="text"
                className="input-box pointer-events-auto"
                placeholder="Type an idea and press Enter..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};

'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export function TagInput({ value = [], onChange, placeholder, label, className }: TagInputProps) {
    const [inputValue, setInputValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ',') && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim().replace(',', '');
            if (newTag && !value.includes(newTag)) {
                onChange([...value, newTag]);
                setInputValue('');
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            e.preventDefault();
            const newValue = [...value];
            newValue.pop();
            onChange(newValue);
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-1.5 p-2 bg-transparent border-b border-input focus-within:border-ring transition-colors", className)}>
            {label && <span className="text-sm font-medium text-muted-foreground select-none mr-1">{label}</span>}

            {value.map((tag) => (
                <div
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-sm rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 animate-in fade-in zoom-in-95 duration-200"
                >
                    <span className="max-w-[200px] truncate">{tag}</span>
                    <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted-foreground hover:text-foreground outline-none"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}

            <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-[120px]"
                placeholder={value.length === 0 ? placeholder : ''}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    if (inputValue.trim()) {
                        const newTag = inputValue.trim().replace(',', '');
                        if (newTag && !value.includes(newTag)) {
                            onChange([...value, newTag]);
                            setInputValue('');
                        }
                    }
                }}
            />
        </div>
    );
}

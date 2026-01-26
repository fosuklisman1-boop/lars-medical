'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'

interface AutocompleteInputProps {
    name: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    field: string // The field name for fetching suggestions
    className?: string
    disabled?: boolean
}

export function AutocompleteInput({
    name,
    value,
    onChange,
    placeholder,
    field,
    className,
    disabled
}: AutocompleteInputProps) {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Fetch suggestions on mount
    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/reports/suggestions?field=${field}`)
                const result = await response.json()
                if (result.success) {
                    setSuggestions(result.data)
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchSuggestions()
    }, [field])

    // Filter suggestions based on current input
    useEffect(() => {
        if ((value || '').trim() === '') {
            setFilteredSuggestions(suggestions.slice(0, 8))
        } else {
            const filtered = suggestions.filter(suggestion =>
                suggestion.toLowerCase().includes((value || '').toLowerCase())
            ).slice(0, 8)
            setFilteredSuggestions(filtered)
        }
    }, [value, suggestions])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (suggestion: string) => {
        // Create a synthetic event
        const syntheticEvent = {
            target: { name, value: suggestion }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
        setShowSuggestions(false)
    }

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                name={name}
                value={value}
                onChange={onChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
                disabled={disabled}
            />

            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {loading ? (
                        <div className="p-2 text-sm text-gray-500">Loading...</div>
                    ) : (
                        filteredSuggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 border-b last:border-b-0 transition-colors"
                                onClick={() => handleSelect(suggestion)}
                            >
                                {suggestion}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

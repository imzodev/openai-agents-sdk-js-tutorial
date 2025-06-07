'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function Home() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from agent');
      }

      const data = await response.json();
      console.log('Agent response:', data);
      
      // For now, show a success message with the response
      toast.success(data.message || 'Success!');
      
    } catch (error) {
      console.error('Error calling agent:', error);
      toast.error('Failed to get response from agent');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-white text-center mb-12">
          Professional Search
        </h1>
        
        <div className={`relative group transition-all duration-200 ${isFocused ? 'scale-[1.01]' : ''}`}>
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-800 rounded-xl opacity-75 group-hover:opacity-100 transition-all duration-300 ${isFocused ? 'opacity-100 blur-sm' : 'blur-[1px]'}`}></div>
          <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden">
            <div className="flex items-stretch">
              <div className="flex items-center justify-center pl-5 pr-3 text-slate-400">
                <FiSearch size={20} className={isFocused ? 'text-blue-400' : ''} />
              </div>
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Search documents, files, and more..."
                  className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-500 focus:ring-0 text-lg py-5 pr-4 outline-none"
                />
                {query && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setQuery('');
                    }}
                    className="absolute right-2 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-700/50"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              <button 
                className={`${
                  isLoading 
                    ? 'bg-slate-600 cursor-not-allowed' 
                    : 'bg-slate-700 hover:bg-slate-600'
                } text-white font-medium px-6 transition-all duration-200 flex items-center justify-center ${
                  isFocused ? 'w-32' : 'w-24'
                }`}
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isFocused ? 'Processing...' : ''}
                  </span>
                ) : (
                  <span className="whitespace-nowrap">
                    {isFocused ? 'Ask Agent' : 'Ask'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 mt-6 text-sm">
          Search through your documents and files with ease
        </p>
      </div>
    </div>
  );
}

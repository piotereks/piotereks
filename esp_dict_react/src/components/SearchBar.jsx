import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({ word, setWord, onSearch }) => {
  const [input, setInput] = useState(word || '');

  // Update local input state when word prop changes
  useEffect(() => {
    setInput(word || '');
  }, [word]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      console.log('SearchBar: Searching for:', input.trim());
      onSearch(input.trim());
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setWord(e.target.value);
  };

  return (
    <form 
      className="flex justify-center items-center gap-2 mb-4 flex-wrap px-3 py-4 bg-white rounded-lg shadow-md border border-gray-200"
      onSubmit={handleSubmit}
    >
      <label htmlFor="word" className="font-semibold text-gray-700 text-sm md:text-base">Find:</label>
      <div className="relative">
        <input
          type="text"
          id="word"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter word..."
          className="px-3 py-2 pl-9 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all w-48 md:w-64 text-sm"
        />
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
      </div>
      <button 
        type="submit"
        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg text-sm md:text-base"
      >
        Search
      </button>
    </form>
  );
};
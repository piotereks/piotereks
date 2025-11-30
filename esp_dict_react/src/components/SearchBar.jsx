import React from 'react';

export const SearchBar = ({ word, setWord, onSearch }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(word);
  };

  return (
    <form className="form-inline justify-content-center mb-4" onSubmit={handleSubmit}>
      <label htmlFor="word" className="mr-sm-2">Enter a word:</label>
      <input
        type="text"
        id="word"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
        className="form-control mr-sm-2"
      />
      <button 
        type="submit"
        className="btn btn-primary"
      >
        Search
      </button>
    </form>
  );
};
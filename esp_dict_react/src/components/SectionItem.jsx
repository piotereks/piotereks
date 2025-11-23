import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const SectionItem = ({ title, isOpen, loading, content, onToggle }) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full bg-gray-100 hover:bg-gray-200 p-3 rounded shadow text-left flex justify-between items-center transition"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="bg-white p-4 rounded shadow mt-2">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      )}
    </div>
  );
};
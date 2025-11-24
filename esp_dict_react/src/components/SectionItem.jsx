import React from 'react';

export const SectionItem = ({ title, isOpen, loading, content, onToggle }) => {
  return (
    <div>
      <button
        onClick={onToggle}
        className={`collapsible btn btn-light btn-sm ${isOpen ? 'active' : ''}`}
      >
        {title}
      </button>
      <div className={`content ${isOpen ? 'show' : ''}`}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </div>
    </div>
  );
};
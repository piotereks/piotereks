import React from 'react';
import { SECTION_CONFIG } from '../config/sections';
import { SectionItem } from './SectionItem';

export const SectionsList = ({ sections, onToggle }) => {
  return (
    <div className="space-y-2">
      {SECTION_CONFIG.map(({ key, title }) => (
        <SectionItem
          key={key}
          sectionKey={key}
          title={title}
          isOpen={sections[key].isOpen}
          loading={sections[key].loading}
          content={sections[key].content}
          onToggle={() => onToggle(key)}
        />
      ))}
    </div>
  );
};
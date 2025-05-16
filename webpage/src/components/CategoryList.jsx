import React from 'react';
import { usePrompts } from '../context/PromptContext';

export function CategoryList() {
  const { categories, activeCategory, setActiveCategory } = usePrompts();
  
  return (
    <div className="py-2 px-1">
      <h2 className="text-base font-medium text-gray-700 mb-2 px-1 category-heading">CATEGORIES</h2>
      <div className="space-y-1">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`
              px-2 py-1 rounded-md cursor-pointer flex items-center justify-between 
              ${activeCategory === category.id 
                ? 'bg-blue-100 text-blue-700 font-semibold' 
                : 'text-gray-700 hover:bg-gray-100'}
            `}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="text-category-name truncate mr-2 flex-grow">{category.name}</span>
            <span className="bg-gray-200 px-1.5 py-0.5 rounded-full font-medium text-category-count flex-shrink-0 count-indicator min-w-[24px] text-center">
              {category.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
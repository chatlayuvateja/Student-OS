import React from 'react';

export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <span className="text-5xl mb-6">{icon}</span>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

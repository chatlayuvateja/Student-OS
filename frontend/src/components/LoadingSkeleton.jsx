import React from 'react';

export default function LoadingSkeleton({ type = 'card', count = 3 }) {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-10 w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="glass-card p-5 flex gap-4">
            <div className="skeleton h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-16 w-full" />
      ))}
    </div>
  );
}

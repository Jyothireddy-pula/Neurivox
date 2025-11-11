// components/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return React.createElement(
    "div",
    { className: "flex justify-center items-center py-4" },
    React.createElement(
      "div",
      {
        className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500",
        role: "status",
        "aria-label": "Loading",
      },
      React.createElement("span", { className: "sr-only" }, "Loading...")
    )
  );
};

export default LoadingSpinner;
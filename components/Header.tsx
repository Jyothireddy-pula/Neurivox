// components/Header.tsx
import React from 'react';
import { BrainIcon } from '../constants'; // Reusing BrainIcon for logo

export const Header: React.FC = () => {
  return React.createElement(
    "header",
    {
      className: "flex items-center justify-center p-4 bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-lg z-20 sticky top-0 md:px-6 lg:px-8"
    },
    // Fix: Pass className prop correctly to BrainIcon, as BrainIcon now accepts it.
    React.createElement(BrainIcon, { 
      className: "w-8 h-8 md:w-10 md:h-10 text-white" 
    }),
    React.createElement(
      "h1",
      {
        className: `
          ml-3 text-2xl md:text-3xl font-extrabold tracking-tight
          bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200
          relative
        `,
        style: {
          textShadow: `
            1px 1px 1px rgba(0,0,0,0.3),
            2px 2px 1px rgba(0,0,0,0.2),
            3px 3px 1px rgba(0,0,0,0.1)
          `
        }
      },
      "Neurivox | OS"
    )
  );
};
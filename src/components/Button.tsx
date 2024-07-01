import React from "react";

interface ButtonProps {
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}

export default function Button({ onClick, color, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white py-2 px-4 rounded m-1 sm:py-1 sm:px-2 sm:text-xs`}
    >
      {children}
    </button>
  );
}

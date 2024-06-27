import React from "react";

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  color: string;
}

export default function Button({ onClick, children, color }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`m-2 px-4 py-2 ${color} text-white rounded-full`}
    >
      {children}
    </button>
  );
}

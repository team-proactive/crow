import React from "react";

interface NavigationBarProps {
  position: "top" | "bottom";
  children: React.ReactNode;
}

export default function NavigationBar({
  position,
  children,
}: NavigationBarProps) {
  const navClass = position === "top" ? "top-0" : "bottom-0";
  return (
    <div
      className={`fixed ${navClass} w-full bg-gray-800 p-2 flex justify-center`}
    >
      {children}
    </div>
  );
}

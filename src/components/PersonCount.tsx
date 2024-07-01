import React from "react";

interface PersonCountProps {
  count: number;
}

const PersonCount: React.FC<PersonCountProps> = ({ count }) => {
  return (
    <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">
      <h2 className="text-xl font-semibold">Person Count</h2>
      <p>{count}</p>
    </div>
  );
};

export default PersonCount;

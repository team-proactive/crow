interface ScoreResultsProps {
  focusScore: number;
  interestScore: number;
  interestRating: string;
}

export default function ScoreResults({
  focusScore,
  interestScore,
  interestRating,
}: ScoreResultsProps) {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow">
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Focus Score</h2>
        <p>{focusScore.toFixed(2)}%</p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Interest Score</h2>
        <p>{interestScore.toFixed(2)}%</p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Interest Rating</h2>
        <p>{interestRating}</p>
      </div>
    </div>
  );
}

import { GestureRecognizerResult } from "../../types/mediapipe";

interface GestureResultsProps {
  gestures: GestureRecognizerResult["gestures"];
}

export default function GestureResults({ gestures }: GestureResultsProps) {
  return (
    <div className="absolute bottom-10 left-4 bg-white p-2 rounded shadow">
      <h2 className="text-xl font-semibold">Detected Gestures</h2>
      <ul>
        {gestures.length > 0 &&
          gestures[0].map((gesture, index) => (
            <li key={index} className="flex justify-between mb-2">
              <span className="mr-2">Gesture: {gesture.categoryName}</span>
              <span>Confidence: {(gesture.score * 100).toFixed(2)}%</span>
            </li>
          ))}
      </ul>
    </div>
  );
}

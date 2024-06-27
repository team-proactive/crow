import { Detection } from "@mediapipe/tasks-vision";

interface DetectionResultsProps {
  detections: Detection[];
}

export default function DetectionResults({
  detections,
}: DetectionResultsProps) {
  return (
    <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">
      <h2 className="text-xl font-semibold">Detected Objects</h2>
      <ul>
        {detections.map((detection, index) => (
          <li key={index}>
            {detection.categories[0].categoryName} -{" "}
            {(detection.categories[0].score * 100).toFixed(2)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

import { FaceLandmarkerResult } from "../../types/mediapipe";

interface FaceBlendShapesProps {
  blendShapes: FaceLandmarkerResult["faceBlendshapes"];
}

export default function FaceBlendShapes({ blendShapes }: FaceBlendShapesProps) {
  return (
    <div className="absolute top-4 right-4 bg-white p-2 rounded shadow max-h-full overflow-y-auto">
      <h2 className="text-xl font-semibold">Face Blend Shapes</h2>
      <ul>
        {blendShapes.length > 0 &&
          blendShapes[0].categories.map((shape, index) => (
            <li key={index} className="flex justify-between mb-2">
              <span className="mr-2">
                {shape.displayName || shape.categoryName}:
              </span>
              <span
                className="flex-grow bg-gray-300 h-5"
                style={{ width: `calc(${shape.score * 100}% - 120px)` }}
              >
                {(shape.score * 100).toFixed(2)}%
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

import { NormalizedLandmark } from "@mediapipe/tasks-vision";

type RunningMode = "IMAGE" | "VIDEO" | "LIVE_STREAM";
type BodyPixInternalResolution = "low" | "medium" | "high";

interface FaceLandmarkerResult {
  faceLandmarks: NormalizedLandmark[][];
  faceBlendshapes: Array<{
    categories: Array<{
      categoryName: string;
      displayName: string;
      score: number;
    }>;
  }>;
}

interface GestureRecognizerResult {
  landmarks: NormalizedLandmark[][];
  gestures: Array<{
    categoryName: string;
    score: number;
  }>[];
  handednesses: Array<{
    categoryName: string;
    displayName: string;
    score: number;
  }>[];
}

export type {
  BodyPixInternalResolution,
  FaceLandmarkerResult,
  GestureRecognizerResult,
  RunningMode,
};

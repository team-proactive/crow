import {
  Detection,
  FaceLandmarkerResult as MPFaceLandmarkerResult,
  GestureRecognizerResult as MPGestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import React from "react";

/**
 * MediaPipe 모델의 실행 모드를 정의합니다.
 */
export type RunningMode = "IMAGE" | "VIDEO" | "LIVE_STREAM";

/**
 * BodyPix 모델의 내부 해상도를 정의합니다.
 */
export type BodyPixInternalResolution = "low" | "medium" | "high";

/**
 * 분류 카테고리를 정의합니다.
 */
export interface Category {
  score: number;
  index: number;
  categoryName: string;
  displayName: string;
}

/**
 * 분류 결과를 정의합니다.
 */
export interface Classifications {
  categories: Category[];
  headIndex: number;
  headName: string;
}

/**
 * 얼굴 랜드마크 감지 결과를 정의합니다.
 * @mediapipe/tasks-vision의 FaceLandmarkerResult를 확장합니다.
 */
export interface FaceLandmarkerResult extends MPFaceLandmarkerResult {
  // MPFaceLandmarkerResult의 모든 속성을 상속받습니다.
  // 필요한 경우 여기에 추가 속성을 정의할 수 있습니다.
}

/**
 * 제스처 인식 결과를 정의합니다.
 * @mediapipe/tasks-vision의 GestureRecognizerResult를 확장합니다.
 */
export interface GestureRecognizerResult extends MPGestureRecognizerResult {
  // MPGestureRecognizerResult의 모든 속성을 상속받습니다.
  // 필요한 경우 여기에 추가 속성을 정의할 수 있습니다.
}

/**
 * 웹캠 예측 결과를 정의합니다.
 */
export interface PredictWebcamResultType {
  detectionResult: {
    detections: Detection[];
  };
  faceLandmarkerResult: FaceLandmarkerResult;
  gestureRecognizerResult: GestureRecognizerResult;
}

/**
 * 3D 공간의 랜드마크를 정의합니다.
 */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * 2차원 행렬을 정의합니다.
 */
export interface Matrix {
  rows: number;
  columns: number;
  data: number[];
}

/**
 * 이미지 처리 옵션을 정의합니다.
 */
export interface ImageProcessingOptions {
  regionOfInterest?: RectF;
  rotationDegrees?: number;
}

/**
 * 정규화된 사각형을 정의합니다.
 */
export interface RectF {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * WebcamControls 컴포넌트의 props를 정의합니다.
 */
export interface WebcamControlsProps {
  enableWebcam: () => void;
  disableWebcam: () => void;
}

/**
 * VideoCanvas 컴포넌트의 props를 정의합니다.
 */
export interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * DetectionResults 컴포넌트의 props를 정의합니다.
 */
export interface DetectionResultsProps {
  detectionsRef: React.MutableRefObject<Detection[]>;
}

/**
 * ScoreDisplay 컴포넌트의 props를 정의합니다.
 */
export interface ScoreDisplayProps {
  focusScoreRef: React.MutableRefObject<number>;
  interestScoreRef: React.MutableRefObject<number>;
  interestRatingRef: React.MutableRefObject<string>;
}

/**
 * BlendShapesDisplay 컴포넌트의 props를 정의합니다.
 */
export interface BlendShapesDisplayProps {
  blendShapesRef: React.MutableRefObject<Classifications[]>;
}

/**
 * GesturesDisplay 컴포넌트의 props를 정의합니다.
 */
export interface GesturesDisplayProps {
  gesturesRef: React.MutableRefObject<Category[][]>;
}

/**
 * MediaPipe 설정 관련 타입을 정의합니다.
 */
export interface MediaPipeConfig {
  MODEL_URLS: {
    objectDetector: string;
    faceLandmarker: string;
    gestureRecognizer: string;
  };
  LANDMARK_VISUALIZATION: {
    showFaceLandmarks: boolean;
    showHandLandmarks: boolean;
    showObjectDetections: boolean;
  };
  RUNNING_MODES: {
    [key: string]: RunningMode;
  };
  SEGMENTATION_CONFIG: {
    internalResolution: BodyPixInternalResolution;
    segmentationThreshold: number;
    scoreThreshold: number;
  };
  COLOR_SETTINGS: {
    faceLandmarks: {
      [key: string]: { color: string; lineWidth?: number };
    };
    objectDetection: {
      boundingBox: { color: string; lineWidth: number };
      text: { color: string };
    };
    handLandmarks: {
      connections: { color: string; lineWidth: number };
      points: { color: string; lineWidth: number };
    };
  };
  VIRTUAL_BACKGROUND_SETTINGS: {
    enable: boolean;
    backgroundColor: { r: number; g: number; b: number; a: number };
    transparency: number;
  };
}

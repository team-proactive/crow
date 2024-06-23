/**
 * MediaPipe 설정 파일
 *
 * MediaPipe 모델 URL 및 설정 값을 정의하는 상수 모음입니다.
 * @module constants/mediapipe
 */

import { BodyPixInternalResolution, RunningMode } from "../../types/mediapipe";

/**
 * 모델 URL 상수 정의
 * - objectDetector: EfficientDet Lite0 모델 URL
 * - faceLandmarker: Face Landmarker 모델 URL
 * - gestureRecognizer: Gesture Recognizer 모델 URL
 */
const MODEL_URLS = {
  objectDetector:
    "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
  faceLandmarker:
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  gestureRecognizer:
    "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
};

/**
 * 랜드마크 시각화 설정 상수
 * - showFaceLandmarks: 얼굴 랜드마크 시각화 여부
 * - showHandLandmarks: 손 랜드마크 시각화 여부
 * - showObjectDetections: 객체 감지 시각화 여부
 */
const LANDMARK_VISUALIZATION = {
  showFaceLandmarks: false,
  showHandLandmarks: true,
  showObjectDetections: false,
};

/**
 * 실행 모드 상수 정의
 * - image: 이미지 모드
 * - video: 비디오 모드
 * - liveStream: 라이브 스트림 모드
 */
const RUNNING_MODES: { [key: string]: RunningMode } = {
  image: "IMAGE",
  video: "VIDEO",
  liveStream: "LIVE_STREAM",
};

/**
 * 세그멘테이션 설정 상수
 * - internalResolution: 내부 해상도 (high)
 * - segmentationThreshold: 세그멘테이션 임계값 (0.7)
 * - scoreThreshold: 점수 임계값 (0.5)
 */
const SEGMENTATION_CONFIG: {
  internalResolution: BodyPixInternalResolution;
  segmentationThreshold: number;
  scoreThreshold: number;
} = {
  internalResolution: "medium",
  segmentationThreshold: 0.7,
  scoreThreshold: 0.5,
};

/**
 * 색상 설정 상수
 * - 얼굴 랜드마크: 각 요소에 대한 색상 설정
 * - 객체 감지: 경계 상자 및 텍스트 색상
 * - 손 랜드마크: 연결선 및 점 색상
 */
const COLOR_SETTINGS = {
  faceLandmarks: {
    tesselation: { color: "#C0C0C070", lineWidth: 1 },
    rightEye: { color: "#FF3030" },
    rightEyebrow: { color: "#FF3030" },
    leftEye: { color: "#30FF30" },
    leftEyebrow: { color: "#30FF30" },
    faceOval: { color: "#E0E0E0" },
    lips: { color: "#E0E0E0" },
    rightIris: { color: "#FF3030" },
    leftIris: { color: "#30FF30" },
  },
  objectDetection: {
    boundingBox: { color: "red", lineWidth: 2 },
    text: { color: "red" },
  },
  handLandmarks: {
    connections: { color: "#00FF00", lineWidth: 5 },
    points: { color: "#FF0000", lineWidth: 2 },
  },
};

/**
 * 가상 배경 설정 상수
 * - enable: 가상 배경 사용 여부
 * - backgroundColor: 가상 배경 색상 설정
 * - transparency: 가상 배경 투명도 설정
 */
const VIRTUAL_BACKGROUND_SETTINGS = {
  enable: false,
  backgroundColor: { r: 0, g: 0, b: 0, a: 255 }, // 검정색 배경
  transparency: 0.5, // 투명도
};

export {
  COLOR_SETTINGS,
  LANDMARK_VISUALIZATION,
  MODEL_URLS,
  RUNNING_MODES,
  SEGMENTATION_CONFIG,
  VIRTUAL_BACKGROUND_SETTINGS,
};

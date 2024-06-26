import {
  BodyPixInternalResolution,
  MediaPipeConfig,
  RunningMode,
} from "../../types/mediapipe";

/**
 * MediaPipe 설정
 *
 * MediaPipe 라이브러리 사용을 위한 전역 설정 값들을 정의합니다.
 * 모델 URL, 랜드마크 시각화 옵션, 실행 모드, 세그멘테이션 설정, 색상 설정 등을 포함합니다.
 */
const MEDIAPIPE_CONFIG: MediaPipeConfig = {
  /**
   * 모델 URL
   *
   * 객체 감지, 얼굴 랜드마크, 제스처 인식을 위한 모델 파일의 URL을 정의합니다.
   */
  MODEL_URLS: {
    objectDetector:
      "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
    faceLandmarker:
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    gestureRecognizer:
      "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
  },

  /**
   * 랜드마크 시각화 설정
   *
   * 얼굴 랜드마크, 손 랜드마크, 객체 감지 결과의 시각화 여부를 설정합니다.
   */
  LANDMARK_VISUALIZATION: {
    showFaceLandmarks: false,
    showHandLandmarks: true,
    showObjectDetections: true,
  },

  /**
   * 실행 모드
   *
   * MediaPipe 작업의 실행 모드를 정의합니다. 이미지, 비디오, 라이브 스트림 모드를 지원합니다.
   */
  RUNNING_MODES: {
    image: "IMAGE",
    video: "VIDEO",
    liveStream: "LIVE_STREAM",
  } as { [key: string]: RunningMode },

  /**
   * 세그멘테이션 설정
   *
   * BodyPix 모델의 세그멘테이션 관련 설정을 정의합니다.
   */
  SEGMENTATION_CONFIG: {
    internalResolution: "high" as BodyPixInternalResolution,
    segmentationThreshold: 0.7,
    scoreThreshold: 0.5,
  },

  /**
   * 색상 설정
   *
   * 얼굴 랜드마크, 객체 감지, 손 랜드마크 시각화에 사용될 색상을 정의합니다.
   */
  COLOR_SETTINGS: {
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
      boundingBox: { color: "green", lineWidth: 2 },
      text: { color: "white" },
    },
    handLandmarks: {
      connections: { color: "yellow", lineWidth: 2 },
      points: { color: "purple", lineWidth: 1 },
    },
  },

  /**
   * 가상 배경 설정
   *
   * 가상 배경 기능 사용 여부, 배경색, 투명도 등을 설정합니다.
   */
  VIRTUAL_BACKGROUND_SETTINGS: {
    enable: false,
    backgroundColor: { r: 0, g: 0, b: 0, a: 255 },
    transparency: 0.5,
  },
};

export default MEDIAPIPE_CONFIG;

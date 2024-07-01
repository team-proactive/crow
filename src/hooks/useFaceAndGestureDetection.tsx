import {
  Detection,
  DrawingUtils,
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
} from "@mediapipe/tasks-vision";
import * as bodyPix from "@tensorflow-models/body-pix";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarkerResult,
  GestureRecognizerResult,
  PredictWebcamResultType,
} from "../../types/mediapipe";
import MEDIAPIPE_CONFIG from "../constants/mediapipe";

/**
 * 얼굴 및 제스처 인식을 관리하는 커스텀 훅
 *
 * 이 훅은 웹캠을 활성화하고 비디오에서 얼굴 랜드마크, 제스처 인식을 수행합니다.
 *
 * @param videoRef - 웹캠 비디오 요소의 RefObject
 * @param canvasRef - 캔버스 요소의 RefObject
 * @param bodyPixNet - 초기화된 BodyPix 모델
 * @returns - enableWebcam, disableWebcam, predictWebcam, webcamRunning을 포함하는 객체
 */
export default function useFaceAndGestureDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  bodyPixNet: bodyPix.BodyPix | null
) {
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const detectionsRef = useRef<Detection[]>([]);
  const blendShapesRef = useRef<FaceLandmarkerResult["faceBlendshapes"]>([]);
  const gesturesRef = useRef<GestureRecognizerResult["gestures"]>([]);
  const handednessRef = useRef<GestureRecognizerResult["handedness"]>([]);
  const focusScoreRef = useRef<number>(0);
  const interestScoreRef = useRef<number>(0);
  const interestRatingRef = useRef<string>("");
  const [webcamRunning, setWebcamRunning] = useState<boolean>(false);
  const [renderTrigger, setRenderTrigger] = useState<number>(0);

  /**
   * FaceLandmarker를 LIVE_STREAM 모드로 초기화하는 함수
   *
   * @returns - 초기화된 FaceLandmarker 인스턴스
   */
  const initializeFaceLandmarker =
    useCallback(async (): Promise<FaceLandmarker> => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_CONFIG.MODEL_URLS.faceLandmarker,
          delegate: "GPU",
        },
        outputFaceBlendshapes: true,
        runningMode: MEDIAPIPE_CONFIG.RUNNING_MODES.liveStream, // LIVE_STREAM 모드
        numFaces: 10,
      });
      return faceLandmarker;
    }, []);

  /**
   * GestureRecognizer를 LIVE_STREAM 모드로 초기화하는 함수
   *
   * @returns - 초기화된 GestureRecognizer 인스턴스
   */
  const initializeGestureRecognizer =
    useCallback(async (): Promise<GestureRecognizer> => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const gestureRecognizer = await GestureRecognizer.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: MEDIAPIPE_CONFIG.MODEL_URLS.gestureRecognizer,
            delegate: "GPU",
          },
          runningMode: MEDIAPIPE_CONFIG.RUNNING_MODES.liveStream, // LIVE_STREAM 모드
          numHands: 2,
        }
      );
      return gestureRecognizer;
    }, []);

  /**
   * 컴포넌트가 마운트될 때 감지기들을 초기화합니다.
   */
  useEffect(() => {
    const initializeDetectors = async () => {
      const [faceLandmarker, gestureRecognizer] = await Promise.all([
        initializeFaceLandmarker(),
        initializeGestureRecognizer(),
      ]);

      faceLandmarkerRef.current = faceLandmarker;
      gestureRecognizerRef.current = gestureRecognizer;
      console.log("Detectors initialized");
    };

    initializeDetectors();
  }, [initializeFaceLandmarker, initializeGestureRecognizer]);

  /**
   * 웹캠 비디오에서 예측을 수행하는 함수
   *
   * @returns - 객체 감지, 얼굴 랜드마크, 제스처 인식 결과를 포함하는 객체
   */
  const predictWebcam =
    useCallback(async (): Promise<PredictWebcamResultType | null> => {
      if (
        !webcamRunning ||
        !videoRef.current ||
        !faceLandmarkerRef.current ||
        !gestureRecognizerRef.current ||
        !bodyPixNet
      ) {
        return null;
      }

      const startTimeMs = performance.now();

      const faceLandmarkerResult: FaceLandmarkerResult =
        await faceLandmarkerRef.current.detectForVideo(
          videoRef.current,
          startTimeMs
        );

      const gestureRecognizerResult: GestureRecognizerResult =
        await gestureRecognizerRef.current.recognizeForVideo(
          videoRef.current,
          startTimeMs
        );

      // 객체 감지 결과는 빈 배열로 설정합니다.
      const detectionResult = { detections: detectionsRef.current };

      return {
        detectionResult,
        faceLandmarkerResult,
        gestureRecognizerResult,
      };
    }, [webcamRunning, videoRef, bodyPixNet]);

  /**
   * 웹캠을 활성화하는 함수
   */
  const enableWebcam = useCallback(async () => {
    if (
      faceLandmarkerRef.current &&
      gestureRecognizerRef.current &&
      videoRef.current &&
      bodyPixNet
    ) {
      try {
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          videoRef.current?.play();

          // 비디오의 실제 해상도를 확인하여 로그에 출력
          const settings = stream.getVideoTracks()[0].getSettings();
          console.log(`Video resolution: ${settings.width}x${settings.height}`);

          // 캔버스 해상도를 비디오 해상도와 일치시키기
          const canvas = canvasRef.current;
          if (canvas && videoRef.current) {
            canvas.width = settings.width || 1280;
            canvas.height = settings.height || 720;
          }

          setWebcamRunning(true);
          console.log("Webcam enabled");
        };
      } catch (err) {
        console.error("웹캠 접근 오류:", err);
      }
    } else {
      console.log("하나 이상의 의존성이 누락되었습니다.");
    }
  }, [videoRef, bodyPixNet, canvasRef]);

  /**
   * 웹캠을 비활성화하는 함수
   */
  const disableWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setWebcamRunning(false);
      console.log("Webcam disabled");
    }
  }, [videoRef]);

  /**
   * 결과를 그리는 함수
   *
   * @param faceLandmarks - 얼굴 랜드마크
   * @param gestureRecognizerResult - 제스처 인식 결과
   * @param focusScore - 집중도 점수
   * @param interestScore - 흥미도 점수
   * @param segmentation - 세그멘테이션 결과
   */
  const drawResults = useCallback(
    (
      faceLandmarks: FaceLandmarkerResult["faceLandmarks"],
      gestureRecognizerResult: GestureRecognizerResult,
      focusScore: number,
      interestScore: number,
      segmentation: bodyPix.SemanticPersonSegmentation
    ) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (canvas && ctx && videoRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (MEDIAPIPE_CONFIG.VIRTUAL_BACKGROUND_SETTINGS.enable) {
          ctx.fillStyle = `rgba(${MEDIAPIPE_CONFIG.VIRTUAL_BACKGROUND_SETTINGS.backgroundColor.r}, ${MEDIAPIPE_CONFIG.VIRTUAL_BACKGROUND_SETTINGS.backgroundColor.g}, ${MEDIAPIPE_CONFIG.VIRTUAL_BACKGROUND_SETTINGS.backgroundColor.b}, ${MEDIAPIPE_CONFIG.VIRTUAL_BACKGROUND_SETTINGS.transparency})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const mask = bodyPix.toMask(
            segmentation,
            { r: 0, g: 0, b: 0, a: 0 },
            MEDIAPIPE_CONFIG.VIRTUAL_BACKGROUND_SETTINGS.backgroundColor
          );
          bodyPix.drawMask(canvas, videoRef.current, mask, 1, 5, false);
        } else {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        }

        const drawingUtils = new DrawingUtils(ctx);

        // 얼굴 랜드마크 그리기
        if (
          MEDIAPIPE_CONFIG.LANDMARK_VISUALIZATION.showFaceLandmarks &&
          faceLandmarks
        ) {
          for (const landmarks of faceLandmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_TESSELATION,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.tesselation
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.rightEye
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.rightEyebrow
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.leftEye
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.leftEyebrow
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.faceOval
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LIPS,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.lips
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.rightIris
            );
            drawingUtils.drawConnectors(
              landmarks,
              FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.faceLandmarks.leftIris
            );
          }
        }

        // 손 랜드마크 그리기
        if (
          MEDIAPIPE_CONFIG.LANDMARK_VISUALIZATION.showHandLandmarks &&
          gestureRecognizerResult.landmarks
        ) {
          for (const landmarks of gestureRecognizerResult.landmarks) {
            drawingUtils.drawConnectors(
              landmarks,
              GestureRecognizer.HAND_CONNECTIONS,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.handLandmarks.connections
            );
            drawingUtils.drawLandmarks(
              landmarks,
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.handLandmarks.points
            );
          }
        }
      }
    },
    [canvasRef, videoRef]
  );

  /**
   * 집중도 점수를 계산하는 함수
   *
   * @param blendShapes - 얼굴 블렌드쉐이프
   * @returns - 집중도 점수
   */
  const calculateFocusScore = useCallback(
    (blendShapes: FaceLandmarkerResult["faceBlendshapes"]) => {
      if (blendShapes.length === 0) return 0;

      let score = 0;

      blendShapes[0].categories.forEach((shape) => {
        if (
          shape.categoryName === "eyeBlinkLeft" ||
          shape.categoryName === "eyeBlinkRight"
        ) {
          score += shape.score;
        }
      });

      return (1 - score) * 100;
    },
    []
  );

  /**
   * 흥미도 점수를 계산하는 함수
   *
   * @param blendShapes - 얼굴 블렌드쉐이프
   * @returns - 흥미도 점수
   */
  const calculateInterestScore = useCallback(
    (blendShapes: FaceLandmarkerResult["faceBlendshapes"]) => {
      if (blendShapes.length === 0) return 0;

      let score = 0;

      blendShapes[0].categories.forEach((shape) => {
        if (
          shape.categoryName === "smile" ||
          shape.categoryName === "mouthOpen" ||
          shape.categoryName === "mouthSmileLeft" ||
          shape.categoryName === "mouthSmileRight"
        ) {
          score += shape.score;
        }
      });

      return score * 25;
    },
    []
  );

  /**
   * 흥미도를 등급으로 변환하는 함수
   *
   * @param interestScore - 흥미도 점수
   * @returns - 흥미도 등급
   */
  const getInterestRating = useCallback((interestScore: number) => {
    if (interestScore >= 80) return "아주좋음";
    if (interestScore >= 60) return "좋음";
    if (interestScore >= 40) return "보통";
    if (interestScore >= 20) return "나쁨";
    return "아주나쁨";
  }, []);

  // useEffect로 predictWebcam 함수 호출 및 결과 시각화
  useEffect(() => {
    let animationFrameId: number;
    const predictLoop = async () => {
      if (!webcamRunning) return;

      const result = await predictWebcam();
      if (!result) {
        animationFrameId = requestAnimationFrame(predictLoop);
        return;
      }

      const { detectionResult, faceLandmarkerResult, gestureRecognizerResult } =
        result;
      detectionsRef.current = detectionResult.detections;
      blendShapesRef.current = faceLandmarkerResult.faceBlendshapes;
      gesturesRef.current = gestureRecognizerResult.gestures;
      handednessRef.current = gestureRecognizerResult.handedness;

      focusScoreRef.current = calculateFocusScore(
        faceLandmarkerResult.faceBlendshapes
      );
      interestScoreRef.current = calculateInterestScore(
        faceLandmarkerResult.faceBlendshapes
      );
      interestRatingRef.current = getInterestRating(interestScoreRef.current);

      if (bodyPixNet && videoRef.current) {
        const segmentation = await bodyPixNet.segmentPerson(videoRef.current, {
          internalResolution:
            MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.internalResolution,
          segmentationThreshold:
            MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.segmentationThreshold,
          scoreThreshold: MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.scoreThreshold,
        });

        drawResults(
          faceLandmarkerResult.faceLandmarks,
          gestureRecognizerResult,
          focusScoreRef.current,
          interestScoreRef.current,
          segmentation
        );
      }

      setRenderTrigger((prev) => prev + 1);
      animationFrameId = requestAnimationFrame(predictLoop);
    };

    if (webcamRunning) {
      predictLoop();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    webcamRunning,
    predictWebcam,
    bodyPixNet,
    calculateFocusScore,
    calculateInterestScore,
    getInterestRating,
    drawResults,
    setRenderTrigger,
    videoRef,
  ]);

  return {
    enableWebcam,
    disableWebcam,
    webcamRunning,
    blendShapes: blendShapesRef.current,
    gestures: gesturesRef.current,
    handednesses: handednessRef.current,
    focusScore: focusScoreRef.current,
    interestScore: interestScoreRef.current,
    interestRating: interestRatingRef.current,
  };
}

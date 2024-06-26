import {
  Detection,
  DrawingUtils,
  FaceLandmarker,
  GestureRecognizer,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarkerResult,
  GestureRecognizerResult,
  PredictWebcamResultType,
} from "../types/mediapipe";
import MEDIAPIPE_CONFIG from "./constants/mediapipe";
import useMediapipeSetup from "./hooks/useMediapipeSetup";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionsRef = useRef<Detection[]>([]);
  const blendShapesRef = useRef<FaceLandmarkerResult["faceBlendshapes"]>([]);
  const gesturesRef = useRef<GestureRecognizerResult["gestures"]>([]);
  const handednessesRef = useRef<GestureRecognizerResult["handednesses"]>([]);
  const focusScoreRef = useRef<number>(0);
  const interestScoreRef = useRef<number>(0);
  const interestRatingRef = useRef<string>("");
  const [net, setNet] = useState<bodyPix.BodyPix | null>(null);
  const [renderTrigger, setRenderTrigger] = useState<number>(0);

  useEffect(() => {
    const loadBodyPix = async () => {
      console.log("Loading BodyPix...");
      const bodyPixNet = await bodyPix.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        quantBytes: 2,
      });
      setNet(bodyPixNet);
      console.log("BodyPix loaded.");
    };

    loadBodyPix();
  }, []);

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

  const getInterestRating = useCallback((interestScore: number) => {
    if (interestScore >= 80) return "아주좋음";
    if (interestScore >= 60) return "좋음";
    if (interestScore >= 40) return "보통";
    if (interestScore >= 20) return "나쁨";
    return "아주나쁨";
  }, []);

  const drawResults = useCallback(
    (
      faceLandmarks: NormalizedLandmark[][],
      detections: Detection[],
      gestureRecognizerResult: GestureRecognizerResult,
      focusScores: number[],
      interestScores: number[],
      interestRatings: string[],
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

        if (MEDIAPIPE_CONFIG.LANDMARK_VISUALIZATION.showObjectDetections) {
          for (const [i, detection] of detections.entries()) {
            if (detection.boundingBox) {
              ctx.strokeStyle =
                MEDIAPIPE_CONFIG.COLOR_SETTINGS.objectDetection.boundingBox.color;
              ctx.lineWidth =
                MEDIAPIPE_CONFIG.COLOR_SETTINGS.objectDetection.boundingBox.lineWidth;
              ctx.strokeRect(
                detection.boundingBox.originX,
                detection.boundingBox.originY,
                detection.boundingBox.width,
                detection.boundingBox.height
              );

              ctx.fillStyle =
                MEDIAPIPE_CONFIG.COLOR_SETTINGS.objectDetection.text.color;
              ctx.fillText(
                `${detection.categories[0].categoryName} - ${(
                  detection.categories[0].score * 100
                ).toFixed(2)}%`,
                detection.boundingBox.originX,
                detection.boundingBox.originY > 10
                  ? detection.boundingBox.originY - 5
                  : 10
              );

              // 흥미도 및 집중도, 제스처 결과를 각 객체 박스 안에 표시
              ctx.fillText(
                `Focus: ${focusScores[i].toFixed(2)}%`,
                detection.boundingBox.originX,
                detection.boundingBox.originY +
                  detection.boundingBox.height +
                  20
              );
              ctx.fillText(
                `Interest: ${interestScores[i].toFixed(2)}%`,
                detection.boundingBox.originX,
                detection.boundingBox.originY +
                  detection.boundingBox.height +
                  40
              );
              ctx.fillText(
                `Rating: ${interestRatings[i]}`,
                detection.boundingBox.originX,
                detection.boundingBox.originY +
                  detection.boundingBox.height +
                  60
              );
              if (gestureRecognizerResult.gestures[i]) {
                ctx.fillText(
                  `Gesture: ${gestureRecognizerResult.gestures[i][0].categoryName}`,
                  detection.boundingBox.originX,
                  detection.boundingBox.originY +
                    detection.boundingBox.height +
                    80
                );
              }
            }
          }
        }

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

  const { enableWebcam, disableWebcam, predictWebcam, webcamRunning } =
    useMediapipeSetup(videoRef, canvasRef, net);

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
        result as PredictWebcamResultType;
      detectionsRef.current = detectionResult.detections;
      blendShapesRef.current = faceLandmarkerResult.faceBlendshapes;
      gesturesRef.current = gestureRecognizerResult.gestures;
      handednessesRef.current = gestureRecognizerResult.handednesses;

      const focusScores: number[] = [];
      const interestScores: number[] = [];
      const interestRatings: string[] = [];

      for (let i = 0; i < detectionResult.detections.length; i++) {
        focusScores.push(
          calculateFocusScore(faceLandmarkerResult.faceBlendshapes)
        );
        interestScores.push(
          calculateInterestScore(faceLandmarkerResult.faceBlendshapes)
        );
        interestRatings.push(getInterestRating(interestScores[i]));
      }

      if (net && videoRef.current) {
        const segmentation = await net.segmentPerson(videoRef.current, {
          internalResolution:
            MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.internalResolution,
          segmentationThreshold:
            MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.segmentationThreshold,
          scoreThreshold: MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.scoreThreshold,
        });

        drawResults(
          faceLandmarkerResult.faceLandmarks,
          detectionResult.detections,
          gestureRecognizerResult,
          focusScores,
          interestScores,
          interestRatings,
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
    net,
    calculateFocusScore,
    calculateInterestScore,
    getInterestRating,
    drawResults,
  ]);

  return (
    <div className="bg-slate-500">
      <h1 className="text-2xl font-bold mb-4">
        Webcam Object, Face, and Gesture Detection
      </h1>
      <div className="mb-4">
        <button
          onClick={enableWebcam}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Enable Webcam
        </button>
        <button
          onClick={disableWebcam}
          className="px-4 py-2 bg-red-500 text-white rounded ml-4"
        >
          Disable Webcam
        </button>
      </div>
      <div id="liveView" className="relative w-full">
        <video ref={videoRef} autoPlay playsInline className="w-full" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Detected Objects</h2>
        <ul>
          {detectionsRef.current.map((detection, index) => (
            <li key={index}>
              {detection.categories[0].categoryName} -{" "}
              {(detection.categories[0].score * 100).toFixed(2)}%
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Focus Score</h2>
        <p>{focusScoreRef.current.toFixed(2)}%</p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Interest Score</h2>
        <p>{interestScoreRef.current.toFixed(2)}%</p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Interest Rating</h2>
        <p>{interestRatingRef.current}</p>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Face Blend Shapes</h2>
        <ul>
          {blendShapesRef.current.length > 0 &&
            blendShapesRef.current[0].categories.map((shape, index) => (
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
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Detected Gestures</h2>
        <ul>
          {gesturesRef.current.length > 0 &&
            gesturesRef.current[0].map((gesture, index) => (
              <li key={index} className="flex justify-between mb-2">
                <span className="mr-2">Gesture: {gesture.categoryName}</span>
                <span>Confidence: {(gesture.score * 100).toFixed(2)}%</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

import { Detection } from "@mediapipe/tasks-vision";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaceLandmarkerResult,
  GestureRecognizerResult,
  PredictWebcamResultType,
} from "../types/mediapipe";
import useMediapipeSetup from "./hooks/useMediapipeSetup";

import Button from "./components/Button";
import DetectionResults from "./components/DetectionResults";
import FaceBlendShapes from "./components/FaceBlendShapes";
import GestureResults from "./components/GestureResults";
import NavigationBar from "./components/NavigationBar";
import ScoreResults from "./components/ScoreResults";

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

      focusScoreRef.current = focusScores[0];
      interestScoreRef.current = interestScores[0];
      interestRatingRef.current = interestRatings[0];

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
    calculateFocusScore,
    calculateInterestScore,
    getInterestRating,
  ]);

  return (
    <div className="bg-slate-500 fixed w-full h-full">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Webcam Object, Face, and Gesture Detection
      </h1>
      <NavigationBar position="top">
        <Button onClick={enableWebcam} color="bg-blue-500">
          Enable Webcam
        </Button>
        <Button onClick={disableWebcam} color="bg-red-500">
          Disable Webcam
        </Button>
      </NavigationBar>
      <div id="liveView" className="relative w-full h-full">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        <DetectionResults detections={detectionsRef.current} />
        <FaceBlendShapes blendShapes={blendShapesRef.current} />
        <GestureResults gestures={gesturesRef.current} />
        <ScoreResults
          focusScore={focusScoreRef.current}
          interestScore={interestScoreRef.current}
          interestRating={interestRatingRef.current}
        />
      </div>
    </div>
  );
}

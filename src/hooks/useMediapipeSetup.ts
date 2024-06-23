import {
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
  ObjectDetector,
} from "@mediapipe/tasks-vision";
import * as bodyPix from "@tensorflow-models/body-pix";
import { useCallback, useEffect, useRef, useState } from "react";
import { MODEL_URLS, RUNNING_MODES } from "../constants/mediapipe";

export default function useMediapipeSetup(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  net: bodyPix.BodyPix | null
) {
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const [webcamRunning, setWebcamRunning] = useState<boolean>(false);

  useEffect(() => {
    const initializeDetectors = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      const [objectDetector, faceLandmarker, gestureRecognizer] =
        await Promise.all([
          ObjectDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URLS.objectDetector,
              delegate: "GPU",
            },
            scoreThreshold: 0.5,
            runningMode: RUNNING_MODES.liveStream,
          }),
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URLS.faceLandmarker,
              delegate: "GPU",
            },
            outputFaceBlendshapes: true,
            runningMode: RUNNING_MODES.liveStream,
            numFaces: 1,
          }),
          GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URLS.gestureRecognizer,
              delegate: "GPU",
            },
            runningMode: RUNNING_MODES.liveStream,
            numHands: 2,
          }),
        ]);

      objectDetectorRef.current = objectDetector;
      faceLandmarkerRef.current = faceLandmarker;
      gestureRecognizerRef.current = gestureRecognizer;
    };

    initializeDetectors();
  }, []);

  const predictWebcam = useCallback(async () => {
    if (
      !webcamRunning ||
      !videoRef.current ||
      !objectDetectorRef.current ||
      !faceLandmarkerRef.current ||
      !gestureRecognizerRef.current ||
      !net
    ) {
      return null;
    }

    if (
      videoRef.current.readyState !== 4 ||
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) {
      return null;
    }

    const startTimeMs = performance.now();
    const [detectionResult, faceLandmarkerResult, gestureRecognizerResult] =
      await Promise.all([
        objectDetectorRef.current.detectForVideo(videoRef.current, startTimeMs),
        faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs),
        gestureRecognizerRef.current.recognizeForVideo(
          videoRef.current,
          startTimeMs
        ),
      ]);

    return {
      detectionResult,
      faceLandmarkerResult,
      gestureRecognizerResult,
    };
  }, [webcamRunning, videoRef, net]);

  const enableWebcam = useCallback(async () => {
    if (
      objectDetectorRef.current &&
      faceLandmarkerRef.current &&
      gestureRecognizerRef.current &&
      videoRef.current &&
      net
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
          setWebcamRunning(true);
        };
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    } else {
      console.log("One or more dependencies are missing.");
    }
  }, [videoRef, net]);

  const disableWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setWebcamRunning(false);
    }
  }, [videoRef]);

  return {
    enableWebcam,
    disableWebcam,
    predictWebcam,
    webcamRunning,
  };
}

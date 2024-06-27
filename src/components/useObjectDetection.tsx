import {
  Detection,
  FilesetResolver,
  ObjectDetector,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";
import MEDIAPIPE_CONFIG from "../constants/mediapipe";

export default function useObjectDetection(
  videoRef: React.RefObject<HTMLVideoElement>
) {
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const detectionsRef = useRef<Detection[]>([]);
  const [webcamRunning, setWebcamRunning] = useState<boolean>(false);

  const initializeObjectDetector =
    useCallback(async (): Promise<ObjectDetector> => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const objectDetector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_CONFIG.MODEL_URLS.objectDetector,
          delegate: "GPU",
        },
        scoreThreshold: 0.5,
        runningMode: MEDIAPIPE_CONFIG.RUNNING_MODES.video,
        maxResults: -1,
      });
      return objectDetector;
    }, []);

  useEffect(() => {
    const initialize = async () => {
      const objectDetector = await initializeObjectDetector();
      objectDetectorRef.current = objectDetector;
      console.log("ObjectDetector initialized");
    };

    initialize();
  }, [initializeObjectDetector]);

  const predictObjects = useCallback(async () => {
    if (!webcamRunning || !videoRef.current || !objectDetectorRef.current) {
      return null;
    }

    const startTimeMs = performance.now();
    const detectionResult = await objectDetectorRef.current.detectForVideo(
      videoRef.current,
      startTimeMs
    );

    detectionsRef.current = detectionResult.detections;

    return detectionResult;
  }, [webcamRunning, videoRef]);

  const enableWebcam = useCallback(async () => {
    if (objectDetectorRef.current && videoRef.current) {
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
          console.log("Webcam enabled for object detection");
        };
      } catch (err) {
        console.error("웹캠 접근 오류:", err);
      }
    } else {
      console.log("ObjectDetector is not initialized.");
    }
  }, [videoRef]);

  const disableWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setWebcamRunning(false);
      console.log("Webcam disabled for object detection");
    }
  }, [videoRef]);

  return {
    enableWebcam,
    disableWebcam,
    predictObjects,
    detections: detectionsRef.current,
    webcamRunning,
  };
}

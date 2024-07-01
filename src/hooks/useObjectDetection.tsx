import {
  BoundingBox,
  Detection,
  FilesetResolver,
  ObjectDetector,
} from "@mediapipe/tasks-vision";
import * as bodyPix from "@tensorflow-models/body-pix";
import { BodyPix } from "@tensorflow-models/body-pix/dist/body_pix_model";
import { useCallback, useEffect, useRef, useState } from "react";
import MEDIAPIPE_CONFIG from "../constants/mediapipe";

export default function useObjectDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>
) {
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const detectionsRef = useRef<Detection[]>([]);
  const bodyPixNetRef = useRef<BodyPix | null>(null);
  const [webcamRunning, setWebcamRunning] = useState<boolean>(false);
  const [personCount, setPersonCount] = useState<number>(0);

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

      const bodyPixNet = await bodyPix.load();
      bodyPixNetRef.current = bodyPixNet;
      console.log("BodyPix initialized");
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

    const personDetections = detectionResult.detections.filter((detection) =>
      detection.categories.some(
        (category) => category.categoryName === "person"
      )
    );
    setPersonCount(personDetections.length);

    return detectionResult;
  }, [webcamRunning, videoRef]);

  const enableWebcam = useCallback(async () => {
    if (
      objectDetectorRef.current &&
      videoRef.current &&
      bodyPixNetRef.current
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

          const settings = stream.getVideoTracks()[0].getSettings();
          console.log(`Video resolution: ${settings.width}x${settings.height}`);

          const canvas = canvasRef.current;
          if (canvas && videoRef.current) {
            canvas.width = settings.width || 1280;
            canvas.height = settings.height || 720;
          }

          setWebcamRunning(true);
          console.log("Webcam enabled for object detection");
        };
      } catch (err) {
        console.error("웹캠 접근 오류:", err);
      }
    } else {
      console.log("ObjectDetector or BodyPix is not initialized.");
    }
  }, [videoRef, canvasRef]);

  const disableWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setWebcamRunning(false);
      console.log("Webcam disabled for object detection");
    }
  }, [videoRef]);

  const drawResults = useCallback(
    (
      detections: Detection[],
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

        detections.forEach((detection) => {
          if (detection.boundingBox) {
            const { originX, originY, width, height } =
              detection.boundingBox as BoundingBox;
            ctx.strokeStyle =
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.objectDetection.boundingBox.color;
            ctx.lineWidth =
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.objectDetection.boundingBox.lineWidth;
            ctx.strokeRect(originX, originY, width, height);

            ctx.fillStyle =
              MEDIAPIPE_CONFIG.COLOR_SETTINGS.objectDetection.text.color;
            ctx.fillText(
              `${detection.categories[0].categoryName} - ${(
                detection.categories[0].score * 100
              ).toFixed(2)}%`,
              originX,
              originY > 100 ? originY - 5 : 10
            );
          }
        });
      }
    },
    [canvasRef, videoRef]
  );

  useEffect(() => {
    let animationFrameId: number;
    const predictLoop = async () => {
      if (!webcamRunning) return;

      const detectionResult = await predictObjects();
      if (detectionResult && bodyPixNetRef.current && videoRef.current) {
        const segmentation = await bodyPixNetRef.current.segmentPerson(
          videoRef.current,
          {
            internalResolution:
              MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.internalResolution,
            segmentationThreshold:
              MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.segmentationThreshold,
            scoreThreshold: MEDIAPIPE_CONFIG.SEGMENTATION_CONFIG.scoreThreshold,
          }
        );

        drawResults(detectionResult.detections, segmentation);
      }

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
  }, [webcamRunning, predictObjects, drawResults, videoRef]);

  return {
    enableWebcam,
    disableWebcam,
    detections: detectionsRef.current,
    webcamRunning,
    personCount,
  };
}

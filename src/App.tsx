import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import { Classifications } from "../types/mediapipe";

import Button from "./components/Button";
import DetectionResults from "./components/DetectionResults";
import FaceBlendShapes from "./components/FaceBlendShapes";
import GestureResults from "./components/GestureResults";
import NavigationBar from "./components/NavigationBar";
import ScoreResults from "./components/ScoreResults";

import useFaceAndGestureDetection from "./hooks/useFaceAndGestureDetection";
import useObjectDetection from "./hooks/useObjectDetection";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [net, setNet] = useState<bodyPix.BodyPix | null>(null);
  const [objectDetectionEnabled, setObjectDetectionEnabled] = useState(false);
  const [faceGestureDetectionEnabled, setFaceGestureDetectionEnabled] =
    useState(false);

  const {
    enableWebcam: enableObjectDetection,
    disableWebcam: disableObjectDetection,
    detections,
    webcamRunning: objectWebcamRunning,
  } = useObjectDetection(videoRef, canvasRef);

  const {
    enableWebcam: enableFaceAndGestureDetection,
    disableWebcam: disableFaceAndGestureDetection,
    blendShapes,
    gestures,
    handednesses,
    focusScore,
    interestScore,
    interestRating,
    webcamRunning: faceGestureWebcamRunning,
  } = useFaceAndGestureDetection(videoRef, canvasRef, net);

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

  const handleEnableObjectDetection = () => {
    enableObjectDetection();
    setObjectDetectionEnabled(true);
    setFaceGestureDetectionEnabled(false);
  };

  const handleDisableObjectDetection = () => {
    disableObjectDetection();
    setObjectDetectionEnabled(false);
  };

  const handleEnableFaceAndGestureDetection = () => {
    enableFaceAndGestureDetection();
    setFaceGestureDetectionEnabled(true);
    setObjectDetectionEnabled(false);
  };

  const handleDisableFaceAndGestureDetection = () => {
    disableFaceAndGestureDetection();
    setFaceGestureDetectionEnabled(false);
  };

  return (
    <div className="bg-slate-500 fixed w-full h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Webcam Object, Face, and Gesture Detection
      </h1>
      <NavigationBar position="top">
        <Button onClick={handleEnableObjectDetection} color="bg-blue-500">
          Enable Object Detection
        </Button>
        <Button onClick={handleDisableObjectDetection} color="bg-red-500">
          Disable Object Detection
        </Button>
        <Button
          onClick={handleEnableFaceAndGestureDetection}
          color="bg-blue-500"
        >
          Enable Face & Gesture
        </Button>
        <Button
          onClick={handleDisableFaceAndGestureDetection}
          color="bg-red-500"
        >
          Disable Face & Gesture
        </Button>
      </NavigationBar>
      <div id="liveView" className="relative flex-grow">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full grid grid-rows-4 md:grid-rows-2 gap-4 p-4">
          {objectDetectionEnabled && (
            <div className="h-48 md:h-auto overflow-auto hover:opacity-30">
              <DetectionResults detections={detections} />
            </div>
          )}
          {faceGestureDetectionEnabled && (
            <>
              <div className="h-48 md:h-auto overflow-auto">
                <FaceBlendShapes
                  blendShapes={blendShapes as Classifications[]}
                />
              </div>
              <div className="h-48 md:h-auto overflow-auto hover:opacity-30">
                <GestureResults gestures={gestures} />
              </div>
              <div className="h-48 md:h-auto overflow-auto hover:opacity-30">
                <ScoreResults
                  focusScore={focusScore}
                  interestScore={interestScore}
                  interestRating={interestRating}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

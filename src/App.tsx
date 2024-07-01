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

  return (
    <div className="bg-slate-500 fixed w-full h-full">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Webcam Object, Face, and Gesture Detection
      </h1>
      <NavigationBar position="top">
        <Button onClick={enableObjectDetection} color="bg-blue-500">
          Enable Object Detection
        </Button>
        <Button onClick={disableObjectDetection} color="bg-red-500">
          Disable Object Detection
        </Button>
        <Button onClick={enableFaceAndGestureDetection} color="bg-blue-500">
          Enable Face & Gesture Detection
        </Button>
        <Button onClick={disableFaceAndGestureDetection} color="bg-red-500">
          Disable Face & Gesture Detection
        </Button>
      </NavigationBar>
      <div id="liveView" className="relative w-full h-full">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full" />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        <DetectionResults detections={detections} />
        <FaceBlendShapes blendShapes={blendShapes as Classifications[]} />
        <GestureResults gestures={gestures} />
        <ScoreResults
          focusScore={focusScore}
          interestScore={interestScore}
          interestRating={interestRating}
        />
      </div>
    </div>
  );
}

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const AvatarComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<THREE.WebGLRenderer>();
  const scene = useRef<THREE.Scene>(new THREE.Scene());
  const camera = useRef<THREE.PerspectiveCamera>();
  const faceLandmarkerInstance = useRef<FaceLandmarker>();
  const modelRef = useRef<THREE.Group>();

  useEffect(() => {
    const setupThree = async () => {
      console.log("Setting up Three.js");
      scene.current = new THREE.Scene();
      camera.current = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      renderer.current = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,
      });
      renderer.current.setSize(window.innerWidth, window.innerHeight);
      camera.current.position.z = 2;

      const loader = new FBXLoader();
      loader.load("../avatar/Remy.fbx", (fbx) => {
        modelRef.current = fbx;
        scene.current.add(fbx);
      });

      console.log("Loading FaceLandmarker model");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      faceLandmarkerInstance.current = await FaceLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        }
      );

      const update = () => {
        if (videoRef.current && faceLandmarkerInstance.current) {
          const timestamp = Date.now();
          const result = faceLandmarkerInstance.current.detectForVideo(
            videoRef.current,
            timestamp
          );
          if (result.faceLandmarks.length > 0) {
            console.log("Face landmarks detected");
            const landmarks = result.faceLandmarks[0];

            const nose = new THREE.Vector3(
              (landmarks[1].x - 0.5) * 2,
              -(landmarks[1].y - 0.5) * 2,
              landmarks[1].z * 2
            );

            const leftEye = new THREE.Vector3(
              (landmarks[33].x - 0.5) * 2,
              -(landmarks[33].y - 0.5) * 2,
              landmarks[33].z * 2
            );

            const rightEye = new THREE.Vector3(
              (landmarks[263].x - 0.5) * 2,
              -(landmarks[263].y - 0.5) * 2,
              landmarks[263].z * 2
            );

            const mouth = new THREE.Vector3(
              (landmarks[13].x - 0.5) * 2,
              -(landmarks[13].y - 0.5) * 2,
              landmarks[13].z * 2
            );

            if (modelRef.current && scene.current) {
              // Set position and rotation for the eyes and mouth
              const eyeMidpoint = new THREE.Vector3()
                .addVectors(leftEye, rightEye)
                .multiplyScalar(0.5);
              const eyeToNose = new THREE.Vector3()
                .subVectors(nose, eyeMidpoint)
                .normalize();

              // Update eye positions
              const leftEyeObject = modelRef.current.getObjectByName("LeftEye");
              const rightEyeObject =
                modelRef.current.getObjectByName("RightEye");
              const mouthObject = modelRef.current.getObjectByName("Mouth");

              if (leftEyeObject) leftEyeObject.position.copy(leftEye);
              if (rightEyeObject) rightEyeObject.position.copy(rightEye);
              if (mouthObject) mouthObject.position.copy(mouth);

              // Adjust model rotation
              modelRef.current.lookAt(eyeMidpoint.add(eyeToNose));
            }
          } else {
            console.log("No face landmarks detected");
          }
        }
        requestAnimationFrame(update);
        renderer.current!.render(scene.current!, camera.current!);
      };

      update();
    };

    setupThree();

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => {
              console.log("Video stream started");
            })
            .catch((error) => {
              console.error("Error playing video: ", error);
            });
        }
      })
      .catch((error) => {
        console.error("Error accessing webcam: ", error);
      });
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
};

export default AvatarComponent;

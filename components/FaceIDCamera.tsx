"use client";
import React, { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

export default function FaceIDCamera({
  onCapture,
  isActive = true,
}: {
  onCapture: (embedding: number[]) => void;
  isActive?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function setup() {
      try {
        // Select TF backend
        try {
          await tf.setBackend("webgl");
          console.log("[FaceIDCamera] tf backend: webgl");
        } catch (e) {
          console.warn("[FaceIDCamera] webgl not available, falling back to cpu", e);
          await tf.setBackend("cpu");
          console.log("[FaceIDCamera] tf backend: cpu");
        }
        await tf.ready();

        const module = await import("@vladmandic/face-api");
        const faceapi = module.default ?? module;

        console.log("[FaceIDCamera] loading face-api models from /models ...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        ]);
        console.log("[FaceIDCamera] face-api models loaded");

        if (navigator.mediaDevices && isActive && mounted) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();
            }
            setError("");
          } catch (e: any) {
            console.error("[FaceIDCamera] camera access error:", e);
            setError("Camera access denied or not available. Grant camera permission and retry.");
          }
        }
      } catch (e: any) {
        console.error("[FaceIDCamera] FaceAPI setup error:", e);
        setError(
          "Error loading FaceAPI models or initializing TensorFlow backend. Ensure /public/models exists and camera permission allowed. " +
            (e?.message ?? "")
        );
      }
    }
    if (isActive) setup();
    return () => {
      mounted = false;
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive]);

  const handleCapture = async () => {
    setError("");
    if (!videoRef.current) return;
    try {
      const module = await import("@vladmandic/face-api");
      const faceapi = module.default ?? module;

      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });

      console.log("[FaceIDCamera] running detection...");
      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection && detection.descriptor) {
        console.log("[FaceIDCamera] detection OK, descriptor length:", detection.descriptor.length);
        const arr = Array.from(detection.descriptor);
        onCapture(arr);
        if (videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
        }
      } else {
        console.warn("[FaceIDCamera] No face detected");
        setError("No face detected. Make sure your face is clearly visible and try again.");
      }
    } catch (e) {
      console.error("[FaceIDCamera] Face detection error:", e);
      setError("Face detection failed. Check models, camera permissions, and console logs.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        className="mt-4 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        onClick={handleCapture}
        type="button"
        disabled={!isActive}
      >
        Capture Face
      </button>
      <br />
      {isActive && <video ref={videoRef} autoPlay muted width={150} height={150} style={{ borderRadius: 8 }} />}
      {error && <div className="mt-2 text-sm text-red-600 text-center">{error}</div>}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface HandCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  indexFinger: HandCoordinates;
  thumb: HandCoordinates;
  isPinching: boolean;
  isGrabbing: boolean;
}

export interface HandState {
  leftHand: HandData | null;
  rightHand: HandData | null;
  isReady: boolean;
}

export function useHandTracking() {
  const [handState, setHandState] = useState<HandState>({
    leftHand: null,
    rightHand: null,
    isReady: false,
  });
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    let active = true;

    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        if (!active) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2 // Support two hands
        });

        if (!active) return;
        landmarkerRef.current = landmarker;

        // Start camera
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        videoRef.current = video;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (!active) return;
        
        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
          if (active) {
            setHandState(prev => ({ ...prev, isReady: true }));
            predictWebcam();
          }
        });
      } catch (err) {
        console.error("Error initializing MediaPipe or accessing webcam:", err);
      }
    };

    let lastVideoTime = -1;
    const predictWebcam = () => {
      if (!active) return;
      
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      
      if (video && landmarker && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = landmarker.detectForVideo(video, performance.now());
        
        const newHandState: HandState = {
          leftHand: null,
          rightHand: null,
          isReady: true,
        };

        if (results.landmarks && results.landmarks.length > 0) {
          results.landmarks.forEach((landmarks, index) => {
            // MediaPipe handedness is from the camera's perspective.
            // When using a front-facing camera, the image is mirrored.
            // Usually 'Right' in MediaPipe corresponds to the physical right hand when mirrored.
            const handedness = results.handednesses[index][0].categoryName;
            const isPhysicalRightHand = handedness === 'Right' || handedness === 'Left'; // We'll just rely on x-coordinate to be safe if needed, but let's trust 'Right' for now.
            
            // Actually, a more robust way for mirrored video is to check the x coordinate.
            // Smaller x (closer to 0) is the left side of the image, which is the physical right hand.
            const wristX = landmarks[0].x;
            const isRightSideOfScreen = wristX > 0.5; // Physical left hand

            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            const wrist = landmarks[0];
            const middleTip = landmarks[12];
            
            // Calculate distance for pinch detection
            const dx = indexTip.x - thumbTip.x;
            const dy = indexTip.y - thumbTip.y;
            const dz = indexTip.z - thumbTip.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Grab detection (all fingers curled)
            const grabDistance = Math.sqrt(
              Math.pow(wrist.x - middleTip.x, 2) + 
              Math.pow(wrist.y - middleTip.y, 2)
            );

            const handData: HandData = {
              indexFinger: { x: indexTip.x, y: indexTip.y, z: indexTip.z },
              thumb: { x: thumbTip.x, y: thumbTip.y, z: thumbTip.z },
              isPinching: distance < 0.05,
              isGrabbing: grabDistance < 0.2,
            };

            // If x is small (left side of image), it's the physical right hand (mirrored)
            if (!isRightSideOfScreen) {
              newHandState.rightHand = handData;
            } else {
              newHandState.leftHand = handData;
            }
          });
        }
        
        setHandState(newHandState);
      }
      
      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    initMediaPipe();

    return () => {
      active = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  return handState;
}

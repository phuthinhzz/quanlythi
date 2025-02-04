import React, { useEffect, useRef, useState } from "react";

const CameraStream = ({ onStatusChange }) => {
  const videoRef = useRef(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraEnabled(true);
        onStatusChange(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setError(
        "Failed to access camera. Please ensure camera access is enabled."
      );
      onStatusChange(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      setIsCameraEnabled(false);
      onStatusChange(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {error ? (
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Camera Error
          </h3>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={initializeCamera}
            className="mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div>
          {/* Video Container */}
          <div className="relative">
            <div className="aspect-w-16 aspect-h-9 bg-gray-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Camera Status Indicator */}
            <div className="absolute top-4 right-4">
              <div className="flex items-center bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                <div
                  className={`h-2 w-2 rounded-full mr-2 ${
                    isCameraEnabled
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-xs font-medium text-white">
                  {isCameraEnabled ? "Camera Active" : "Camera Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Webcam Feed</span>
              </div>
              <div className="flex items-center">
                <span
                  className={`inline-block h-2 w-2 rounded-full mr-2 ${
                    isCameraEnabled ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span
                  className={`text-sm ${
                    isCameraEnabled ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isCameraEnabled ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraStream;

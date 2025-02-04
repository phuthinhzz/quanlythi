import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const UserView = ({ socket, roomId }) => {
  const [localStream, setLocalStream] = useState(null);
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const username = localStorage.getItem("username");
  useEffect(() => {
    // Khởi tạo RTCPeerConnection
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Debug logs for connection states
    peerConnection.current.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.current?.connectionState);
      setIsConnected(peerConnection.current?.connectionState === "connected");
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      console.log(
        "ICE Connection state:",
        peerConnection.current?.iceConnectionState
      );
    };

    // Xử lý ICE candidate
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate");
        socket.emit("ice-candidate", {
          target: roomId,
          candidate: event.candidate,
        });
      }
    };

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);
        if (videoRef.current) {
          console.log("Setting local video stream");
          videoRef.current.srcObject = stream;
        } else {
          console.error("Video ref is not set");
        }

        // Thêm tracks vào peer connection
        stream.getTracks().forEach((track) => {
          if (peerConnection.current && stream) {
            peerConnection.current.addTrack(track, stream);
          }
        });

        // Join room sau khi media đã sẵn sàng
        socket.emit("join-room", { roomId, username });
        console.log("Joined room:", roomId);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };

    initializeMedia();

    // Handle signaling
    const handleAnswer = async ({ sdp }) => {
      try {
        if (!peerConnection.current) return;
        console.log("Received answer");
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
      } catch (err) {
        console.error("Error setting remote description:", err);
      }
    };

    const createAndSendOffer = async () => {
      try {
        if (!peerConnection.current) return;
        console.log("Creating offer");
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        socket.emit("offer", {
          target: roomId,
          sdp: offer,
        });
        console.log("Sent offer");
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    };

    socket.on("user-connected", () => {
      console.log("User connected signal received");
      createAndSendOffer();
    });

    socket.on("answer", handleAnswer);

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (!peerConnection.current) return;
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log("Added ICE candidate");
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    // Cleanup
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      socket.off("user-connected");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [socket, roomId]);

  // Toggle audio/video controls
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Room ID and Connection Status */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-800">Room: {roomId}</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
          <div className="text-gray-600 font-medium">{username}</div>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${
                  isMuted
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-800 hover:bg-gray-700"
                } text-white transition-colors`}
              >
                {/* Microphone Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMuted ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4"
                    />
                  )}
                </svg>
              </button>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  isVideoOff
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-800 hover:bg-gray-700"
                } text-white transition-colors`}
              >
                {/* Camera Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isVideoOff ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Connection Info Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg shadow p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Connection Status</h3>
            <div className="space-y-1 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600">Connection:</span>
                <span className="font-medium">
                  {peerConnection.current?.connectionState || "N/A"}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">ICE Connection:</span>
                <span className="font-medium">
                  {peerConnection.current?.iceConnectionState || "N/A"}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Signaling:</span>
                <span className="font-medium">
                  {peerConnection.current?.signalingState || "N/A"}
                </span>
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700">Media Status</h3>
            <div className="space-y-1 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-600">Audio:</span>
                <span
                  className={`font-medium ${
                    isMuted ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {isMuted ? "Muted" : "Unmuted"}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Video:</span>
                <span
                  className={`font-medium ${
                    isVideoOff ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {isVideoOff ? "Off" : "On"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

UserView.propTypes = {
  socket: PropTypes.object.isRequired,
  roomId: PropTypes.string.isRequired,
};

export default UserView;

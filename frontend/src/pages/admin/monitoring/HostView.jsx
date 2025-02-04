import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const HostView = ({ socket, roomId }) => {
  const peersRef = useRef(new Map());
  const [, forceUpdate] = useState({});
  const [violateUserArray, setViolateUserArray] = useState([]);
  // Hàm tạo peer connection
  const createPeerConnection = (userId) => {
    console.log("Creating peer connection for user:", userId);

    // Kiểm tra và đóng kết nối cũ
    const existingPeer = peersRef.current.get(userId);
    if (existingPeer) {
      existingPeer.connection.close();
      peersRef.current.delete(userId);
    }

    // Tạo peer connection mới
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Xử lý khi nhận được stream
    peerConnection.ontrack = (event) => {
      console.log("Received track from user:", userId);
      const streams = event.streams;
      if (streams && streams.length > 0) {
        const peer = peersRef.current.get(userId);
        if (peer) {
          peer.stream = streams[0];
          forceUpdate({}); // Force update UI
        }
      }
    };

    // Log trạng thái kết nối
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Connection state for ${userId}:`,
        peerConnection.connectionState
      );
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(
        `ICE connection state for ${userId}:`,
        peerConnection.iceConnectionState
      );
    };

    // Xử lý ICE candidate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate to:", userId);
        socket.emit("ice-candidate", {
          target: userId,
          candidate: event.candidate,
        });
      }
    };

    // Tạo peer object
    const peer = {
      userId,
      connection: peerConnection,
    };

    // Lưu peer vào ref
    peersRef.current.set(userId, peer);
    forceUpdate({});

    return peer;
  };
  useEffect(() => {
    const handleUserBlur = ({ userId, userName }) => {
      console.log("hoang ngu", userId, userName);

      setViolateUserArray((prevArray) => {
        const isUserInArray = prevArray.some((id) => id === userId);
        if (isUserInArray) {
          return prevArray; // Nếu đã có userId, trả về mảng cũ.
        } else {
          return [...prevArray, userId]; // Nếu chưa có userId, thêm vào mảng.
        }
      });
    };

    socket.on("user-has-blur", handleUserBlur);

    // Cleanup khi component unmount
    return () => {
      socket.off("user-has-blur", handleUserBlur);
    };
  }, []);

  console.log(violateUserArray);
  useEffect(() => {
    console.log("Host joining room:", roomId);
    socket.emit("create-room", roomId);

    // Xử lý khi có user tham gia
    socket.on("user-joined", ({ userId, username }) => {
      console.log("New user joined:", userId, "with username:", username);
      const peer = createPeerConnection(userId);
      peer.username = username; // Store the username in the peer object
      forceUpdate({});
    });

    // Xử lý offer từ user
    socket.on("offer", async ({ caller, sdp }) => {
      console.log("Received offer from:", caller);
      try {
        let peer = peersRef.current.get(caller);
        if (!peer) {
          peer = createPeerConnection(caller);
        }

        await peer.connection.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );

        if (peer.connection.signalingState === "have-remote-offer") {
          const answer = await peer.connection.createAnswer();
          await peer.connection.setLocalDescription(answer);

          console.log("Sending answer to:", caller);
          socket.emit("answer", {
            target: caller,
            sdp: answer,
          });
        } else {
          console.error(
            "Invalid signaling state for creating answer:",
            peer.connection.signalingState
          );
        }
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    });

    // Xử lý ICE candidate
    socket.on("ice-candidate", async ({ sender, candidate }) => {
      console.log("Received ICE candidate from:", sender);
      const peer = peersRef.current.get(sender);
      if (peer && peer.connection.signalingState !== "closed") {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Successfully added ICE candidate");
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    // Xử lý user rời phòng
    socket.on("user-left", ({ userId }) => {
      console.log("User left:", userId);
      const peer = peersRef.current.get(userId);
      if (peer) {
        peer.connection.close();
        peersRef.current.delete(userId);
        forceUpdate({});
      }
    });

    // Cleanup khi unmount
    return () => {
      peersRef.current.forEach((peer) => {
        peer.connection.close();
      });
      peersRef.current.clear();
      socket.off("user-joined");
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("user-left");
      console.log("Host cleanup completed");
    };
  }, [socket, roomId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Room: {roomId}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Connected users: {peersRef.current.size}
              </p>
            </div>
            {/* Có thể thêm các controls khác ở đây */}
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from(peersRef.current.values()).map((peer) => (
            <div
              key={peer.userId}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              {/* Video Container */}
              <div className="relative aspect-video bg-gray-900">
                <video
                  autoPlay
                  playsInline
                  ref={(node) => {
                    if (node && peer.stream) {
                      node.srcObject = peer.stream;
                    }
                  }}
                  className="w-full h-full object-cover"
                />

                {/* User Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">
                          {(peer.username || peer.userId)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {peer.username || peer.userId.slice(0, 8)}
                        </p>
                        <p className="text-gray-300 text-sm">
                          {peer.stream ? "Connected" : "Connecting..."}
                        </p>
                      </div>
                    </div>

                    {/* Connection Status Indicators */}
                    <div className="flex gap-2">
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            peer.connection.connectionState === "connected"
                              ? "bg-green-400"
                              : "bg-yellow-400"
                          }`}
                        />
                        <span className="text-xs text-white">
                          {peer.connection.connectionState}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            peer.connection.iceConnectionState === "connected"
                              ? "bg-green-400"
                              : "bg-yellow-400"
                          }`}
                        />
                        <span className="text-xs text-white">
                          ICE: {peer.connection.iceConnectionState}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Connection State</p>
                    <p className="font-medium text-gray-900">
                      {peer.connection.connectionState}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">ICE State</p>
                    <p className="font-medium text-gray-900">
                      {peer.connection.iceConnectionState}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">
                      {violateUserArray.some((id) => id === peer.userId) ? (
                        <div
                          onClick={() => {
                            if (socket && socket.connected) {
                              socket.emit("admin-end-exam", {
                                userId: peer.userId,
                              });
                              console.log("Emit thành công", peer.userId);
                            } else {
                              console.error("Socket chưa kết nối!");
                            }
                          }}
                          className="w-full cursor-pointer h-9 flex justify-center items-center bg-red-500 rounded-md active:bg-white"
                        >
                          Kết thúc làm bài
                        </div>
                      ) : (
                        <></>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Connected Users Message */}
        {peersRef.current.size === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-6 inline-block">
              <p className="text-gray-500">Waiting for users to join...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

HostView.propTypes = {
  socket: PropTypes.object.isRequired,
  roomId: PropTypes.string.isRequired,
};

export default HostView;

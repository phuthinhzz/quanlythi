import React, { useState, useEffect } from "react";

const Timer = ({ duration, onTimeUp, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    // Set warning when 5 minutes left
    if (timeLeft === 300) {
      setIsWarning(true);
    }

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`${className} ${
        isWarning ? "text-red-500 animate-pulse" : ""
      }`}
    >
      {formatTime(timeLeft)}
    </div>
  );
};

export default Timer;

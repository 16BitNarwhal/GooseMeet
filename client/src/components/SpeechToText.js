import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import toast from "react-hot-toast";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SpeechToText = ({ meeting_name }) => {
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const activeRef = useRef(false);
  const playingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        console.log("PLAYING", playingRef.current);
        if (playingRef.current) {
          return;
        }

        console.log("Audio capturing ended", transcript);
        if (transcript.toLowerCase().includes("goose")) {
          console.log("GOOSE");
          activeRef.current = true;
        } else if (
          transcript.toLowerCase().includes("thanks") ||
          transcript.toLowerCase().includes("thank you")
        ) {
          console.log("THANKS");
          activeRef.current = false;
        }

        if (activeRef.current) {
          console.log("SENDING");
          sendTranscriptToBackend(transcript);
          playingRef.current = true;
          console.log("PLAYING", playingRef.current);
        }
      };

      recognition.start();
    }
  }, []);

  const sendTranscriptToBackend = async (text) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/process_text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          meeting_name: meeting_name,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Backend response:", data);

      // Stop the previous audio if it exists
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Create and play the new audio file
      if (data.speech_file) {
        const audio = new Audio(`${apiUrl}${data.speech_file}`);
        setCurrentAudio(audio);
        await audio.play();
        setTimeout(() => {
          playingRef.current = false;
        }, audio.duration * 1000);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Failed to process text: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start mt-4">
      {transcript && (
        <div className="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md max-w-xs">
          <p className="text-black dark:text-white text-sm">{transcript}</p>
        </div>
      )}
      {isLoading && (
        <div className="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md max-w-xs">
          <p className="text-black dark:text-white text-sm">Loading...</p>
        </div>
      )}
    </div>
  );
};

export default SpeechToText;

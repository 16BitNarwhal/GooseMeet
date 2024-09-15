import React, { useState, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import toast from "react-hot-toast";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      sendTranscriptToBackend(transcript);
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const sendTranscriptToBackend = async (text) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/process_text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
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
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleListening}
          className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full focus:outline-none"
        >
          {isListening ? (
            <FaMicrophone className="w-5 h-5" />
          ) : (
            <FaMicrophoneSlash className="w-5 h-5" />
          )}
        </button>
        <span className="text-sm font-medium text-black dark:text-white">
          {isListening ? "Listening..." : "Click to start speech-to-text"}
        </span>
      </div>
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

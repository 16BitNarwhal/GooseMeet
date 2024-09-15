import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import toast from "react-hot-toast";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SpeechToText = ({ meeting_name, animCallback }) => {
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const playingRef = useRef(false);
  const currentTranscripts = useRef("");
  const waitingForFinalTranscript = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        currentTranscripts.current += transcript;
        console.log(transcript);
        console.log(currentTranscripts.current);
        setTranscript(transcript);
        
        if (waitingForFinalTranscript.current) {
          console.log("Transcript:", currentTranscripts.current);
          sendTranscriptToBackend(currentTranscripts.current);
          currentTranscripts.current = "";
          waitingForFinalTranscript.current = false;
        }
      };
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleKeyDown = (event) => {
    if ((event.code === 'Space' || event.key === 'm') && !isListeningRef.current) {
      startListening();
    }
  };

  const handleKeyUp = (event) => {
    if ((event.code === 'Space' || event.key === 'm') && isListeningRef.current) {
      stopListening();
      waitingForFinalTranscript.current = true;
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      isListeningRef.current = true;
      console.log('Recognition Started!!');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
      console.log('Recognition Stopped!!'); 
    }
  };

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
        animCallback(`${apiUrl}${data.speech_file}`);
        playingRef.current = true;
        audio.onended = () => {
          playingRef.current = false;
        };
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Failed to process text: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <></>
    // <div className="flex flex-col items-start mt-4">
    //   {transcript && (
    //     <div className="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md max-w-xs">
    //       <p className="text-black dark:text-white text-sm">{transcript}</p>
    //     </div>
    //   )}
    //   {isLoading && (
    //     <div className="mt-2 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-md max-w-xs">
    //       <p className="text-black dark:text-white text-sm">Loading...</p>
    //     </div>
    //   )}
    // </div>
  );
};

export default SpeechToText;

import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from groq import Groq
import time

load_dotenv()
client = OpenAI()
groq_client = Groq()


def text_to_speech(text):
    """convert text to speech using OpenAI's TTS model."""
    client = OpenAI()

    audio_directory = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "audio_files"
    )
    os.makedirs(audio_directory, exist_ok=True)

    timestamp = int(time.time() * 1000)  # Use milliseconds for more uniqueness
    speech_file_path = os.path.join(audio_directory, f"speech_{timestamp}.mp3")

    response = client.audio.speech.create(model="tts-1", voice="alloy", input=text)

    response.stream_to_file(speech_file_path)

    return speech_file_path


def speech_to_text(audio_file):
    """converts speech to text using Groq's distil-whisper model."""
    with open(audio_file, "rb") as file:
        transcription = groq_client.audio.transcriptions.create(
            file=(audio_file, file.read()),
            model="distil-whisper-large-v3-en",
            response_format="text",
            language="en",
            temperature=0.0,
        )
    return transcription

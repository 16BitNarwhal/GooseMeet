import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = OpenAI()
groq_client = Groq()


def text_to_speech(text, output_file="speech.mp3", voice="alloy"):
    """convert text to speech using OpenAI's TTS model."""
    speech_file_path = Path(__file__).parent / output_file
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
    )
    response.stream_to_file(speech_file_path)
    return str(speech_file_path)


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

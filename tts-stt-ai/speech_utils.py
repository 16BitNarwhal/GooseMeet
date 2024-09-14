import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI()


def text_to_speech(text, output_file="speech.mp3", voice="alloy"):
    """Convert text to speech using OpenAI's TTS model."""
    speech_file_path = Path(__file__).parent / output_file
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
    )
    response.stream_to_file(speech_file_path)
    return str(speech_file_path)


def speech_to_text(audio_file):
    """Convert speech to text using OpenAI's Whisper model."""
    with open(audio_file, "rb") as audio:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio,
        )
    return transcript.text

import os
import pyaudio
import wave
import pygame
from speech_utils import text_to_speech, speech_to_text
from ai_conversation import get_ai_response, create_conversation_embedding
import threading
import uuid
from langchain.chains import RetrievalQA
import numpy as np
import time


def is_silent(data, threshold=500):
    """Returns 'True' if below the 'silent' threshold"""
    return np.abs(np.frombuffer(data, np.int16)).mean() < threshold


def record_audio(filename="input.wav", silent=False, duration=None):
    """records audio from the microphone until silence is detected or a duration is reached."""
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    SILENCE_THRESHOLD = 500
    SILENCE_DURATION = 2

    p = pyaudio.PyAudio()

    input_device_index = None
    for i in range(p.get_device_count()):
        device_info = p.get_device_info_by_index(i)
        if device_info["maxInputChannels"] > 0:
            input_device_index = i
            break

    if input_device_index is None:
        raise RuntimeError("No input device found")

    try:
        stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            input_device_index=input_device_index,
            frames_per_buffer=CHUNK,
        )

        if not silent:
            print("Recording...")
        frames = []
        silent_chunks = 0
        start_time = time.time()
        while True:
            data = stream.read(CHUNK)
            frames.append(data)
            if is_silent(data, SILENCE_THRESHOLD):
                silent_chunks += 1
            else:
                silent_chunks = 0
            if silent_chunks > (RATE / CHUNK * SILENCE_DURATION):
                break
            if duration and (time.time() - start_time) > duration:
                break
        if not silent:
            print("Recording finished.")

        stream.stop_stream()
        stream.close()
        p.terminate()

        wf = wave.open(filename, "wb")
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))
        wf.close()

    finally:
        if "stream" in locals():
            stream.stop_stream()
            stream.close()
        p.terminate()


def play_audio(file_path, stop_event):
    """plays an audio file with interruption support."""
    pygame.mixer.init()
    pygame.mixer.music.load(file_path)
    pygame.mixer.music.play()
    while pygame.mixer.music.get_busy() and not stop_event.is_set():
        pygame.time.Clock().tick(10)
    pygame.mixer.music.stop()


def main():
    print(
        "Welcome to the voice conversation app. Say 'goodbye' to end the conversation."
    )
    print("Say 'Mr. Goose' to interrupt the AI's speech.")

    stop_event = threading.Event()
    conversation_id = str(uuid.uuid4())
    print(f"Conversation ID: {conversation_id}")

    full_conversation = []

    while True:
        record_audio()
        user_input = speech_to_text("input.wav")
        print(f"You said: {user_input}")

        if "goodbye" in user_input.lower():
            print("Goodbye!")
            break

        if "goose" in user_input.lower():
            stop_event.set()
            print("AI speech interrupted.")
            continue

        full_conversation.append(f"User: {user_input}")

        ai_response = get_ai_response(user_input, full_conversation)
        print(f"AI response: {ai_response}")

        full_conversation.append(f"AI: {ai_response}")

        speech_file = text_to_speech(ai_response)

        stop_event.clear()
        audio_thread = threading.Thread(
            target=play_audio, args=(speech_file, stop_event)
        )
        audio_thread.start()

        while audio_thread.is_alive():
            record_audio(duration=2, silent=True)
            interrupt_input = speech_to_text("input.wav")
            if "goose" in interrupt_input.lower():
                stop_event.set()
                print("AI speech interrupted.")
                break

        audio_thread.join()

    full_conversation_text = "\n".join(full_conversation)
    create_conversation_embedding(conversation_id, full_conversation_text)


if __name__ == "__main__":
    main()

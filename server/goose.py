from flask import request
from flask_socketio import emit

def setup_goose(app, socketio, meetings):
    @socketio.on('send_audio')
    def handle_send_audio(data):
        print('send_audio', data)
        meeting_name = data['meeting_name']
        try:
            with open('./sample.mp3', 'rb') as f:
                chunk_size = 4096
                while chunk := f.read(chunk_size):
                    socketio.emit('audio_chunk', chunk, room=meeting_name)
                socketio.emit('audio_complete', room=meeting_name)
        except FileNotFoundError:
            emit('error', {'message': 'MP3 file not found'})
        except Exception as e:
            emit('error', {'message': str(e)})

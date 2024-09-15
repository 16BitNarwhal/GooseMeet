from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from chat import setup_chat
from webrtc import setup_webrtc
from goose import setup_goose
import os

def log_message(level: str, message: str, meeting=''):
    DEBUG = 'DEBUG'
    INFO = 'INFO'
    WARNING = 'WARNING'
    ERROR = 'ERROR'
    CRITICAL = 'CRITICAL'

    DEBUG_COLOR = '\033[94m'
    INFO_COLOR = '\033[92m'
    WARNING_COLOR = '\033[93m'
    ERROR_COLOR = '\033[91m'
    CRITICAL_COLOR = '\033[41m'
    RESET_COLOR = '\033[0m'

    color_map = {
        DEBUG: DEBUG_COLOR,
        INFO: INFO_COLOR,
        WARNING: WARNING_COLOR,
        ERROR: ERROR_COLOR,
        CRITICAL: CRITICAL_COLOR
    }
    
    color = color_map.get(level, RESET_COLOR)
    meeting = f"[{meeting}] " if meeting else ''
    print(f"{color}{level} {meeting}- {message}{RESET_COLOR}", flush=True)

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False)

# In-memory storage for each session
meetings = {}

# Setup routes and sockets
@app.route('/api/create-meeting', methods=['POST'])
def create_meeting():
    data = request.get_json()
    username = data['username']
    meeting_name = data['meeting_name']

    if username == '':
        return jsonify({'error': 'Username cannot be empty'}), 400
    if meeting_name in meetings:
        return jsonify({'error': 'Meeting ID already exists, please try again'}), 400

    meetings[meeting_name] = {
        'host': username,
        'users': {}, # {username: sid}
        'chat_history': [] # [{sender: username, text: message}]
    }

    return jsonify({'meeting_name': meeting_name})

@app.route('/api/session/<meeting_name>', methods=['GET'])
def get_session(meeting_name):
    if meeting_name not in meetings:
        return jsonify({'error': 'Meeting ID not found'}), 404
    return jsonify(meetings[meeting_name])

@app.route('/api/users/<meeting_name>', methods=['GET'])
def get_users(meeting_name):
    if meeting_name not in meetings:
        return jsonify({'error': 'Meeting ID not found'}), 404
    if len(meetings[meeting_name]['users']) > 7:
        return jsonify({'error': 'Meeting is full'}), 404
    
    return jsonify(list(meetings[meeting_name]['users'].keys()))

@socketio.on('join')
def handle_join(data):
    if 'username' not in data or 'meeting_name' not in data:
        emit('error', {'message': 'Missing username or meeting ID'}, to=request.sid)
        return

    meeting_name = data['meeting_name']
    username = data['username']
    join_room(meeting_name)
    session = meetings[meeting_name]
    session['users'][username] = request.sid

    emit('user_joined', {'username': username, 'meeting_name': meeting_name}, room=meeting_name)

@socketio.on('disconnect')
def handle_disconnect():
    to_delete = []
    for meeting_name, session in meetings.items():
        if request.sid in session['users'].values():
            username = [username for username, sid in session['users'].items() if sid == request.sid][0]
            del session['users'][username]
            if len(session['users']) == 0:
                to_delete.append(meeting_name)

            emit('user_left', {'meeting_name': meeting_name, 'username': username}, room=meeting_name)

    for meeting_name in to_delete:
        del meetings[meeting_name]

setup_chat(app, socketio, meetings)
setup_webrtc(app, socketio, meetings)
# setup_goose(app, socketio, meetings)

@socketio.on('send_audio')
def handle_send_audio(data):
    meeting_name = data['meeting_name']
    try:
        log_message('INFO', 'Sending audio', meeting_name)
        with open('./sample.mp3', 'rb') as f:
            log_message('INFO', 'Sending audio', meeting_name)
            chunk_size = 4096
            while chunk := f.read(chunk_size):
                emit('audio_chunk', chunk, room=meeting_name)
            emit('audio_complete', room=meeting_name)
    except FileNotFoundError:
        log_message('ERROR', 'MP3 not found', meeting_name)
        emit('error', {'message': 'MP3 file not found'})
    except Exception as e:
        log_message('ERROR', str(e), meeting_name)
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
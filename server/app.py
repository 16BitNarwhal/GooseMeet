from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from chat import setup_chat
from webrtc import setup_webrtc
import os

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

if __name__ == '__main__':
    if os.getenv('TESTING', True):
        socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
    else:
        socketio.run(app, debug=True)
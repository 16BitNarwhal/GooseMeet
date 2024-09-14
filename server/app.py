from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import datetime

def log(level: str, message: str, meeting=''):
    color_map = {
        'DEBUG': '\033[94m',
        'INFO': '\033[92m',
        'WARNING': '\033[93m',
        'ERROR': '\033[91m',
        'CRITICAL': '\033[41m',
        'RESET': '\033[0m'
    }

    color = color_map.get(level, color_map['RESET'])
    meeting = f"[{meeting}] " if meeting else ''
    print(f"{color}{level} {meeting}- {message}{color_map['RESET']}", flush=True)

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False)

meetings = {}

@app.route('/api/start-meeting', methods=['POST'])
def create_meeting():
    data = request.get_json()
    username = data['username']
    meeting_name = data['meeting_name']

    meetings[meeting_name] = {
        'users': [],
        'messages': [], # sender, content, type, time
    }

    # startup goose bot for meeting

    log('INFO', f'[{username}] created meeting', meeting_name)

    return jsonify({'success': True})

@app.route('/api/meeting/<meeting_name>', methods=['GET'])
def get_messages(meeting_name):
    if meeting_name not in meetings:
        return jsonify({'error': 'meeting not found'}), 404
    return jsonify(meetings[meeting_name]['messages'])

@app.route('/api/users/<meeting_name>', methods=['GET'])
def get_users(meeting_name):
    if meeting_name not in meetings:
        return jsonify({'error': 'meeting not found'}), 404
    return jsonify(list(meetings[meeting_name]['users'].keys()))

@socketio.on('chat_message')
def handle_chat_message(data):
    meeting_name = data['meeting_name']
    sender = data['sender']
    message = data['content']

    if meeting_name not in meetings:
        log('ERROR', f'Meeting name not found: {data}')
        emit('error', {f'Meeting name not found: {data}'}, to=request.sid)
        return

    meetings[meeting_name]['messages'].append({'sender': sender, 'content': message, 'type': 'text', 'time': datetime.now()})
    log('INFO', f'[{sender}] sent: {message}', meeting_name)
    emit('chat_message', {'sender': sender, 'content': message}, room=meeting_name)

@socketio.on('join')
def handle_join(data):
    if 'username' not in data or 'meeting_name' not in data:
        log('ERROR', f'Missing username / meeting name: {data}')
        emit('error', {'Missing username / meeting name'}, to=request.sid)
        return

    meeting_name = data['meeting_name']
    username = data['username']
    join_room(meeting_name)
    meeting = meetings[meeting_name]
    meeting['users'][username] = request.sid

    log('INFO', f'[{username}] joined', meeting_name)
    emit('user_joined', {'username': username, 'meeting_name': meeting_name}, room=meeting_name)

@socketio.on('disconnect')
def handle_disconnect():
    to_delete = []
    for meeting_name, meeting in meetings.items():
        if request.sid in meeting['users'].values():
            username = [username for username, sid in meeting['users'].items() if sid == request.sid][0]
            del meetings['users'][username]
            if len(meetings['users']) == 0:
                to_delete.append(meeting_name)
            log('INFO', f'[{username}] left', meeting_name)

            emit('user_left', {'meeting_name': meeting_name, 'username': username}, room=meeting_name)

    for meeting_name in to_delete:
        del meetings[meeting_name]

@socketio.on('offer')
def handle_offer(data):
    to_sid = meetings[data['meeting_name']]['users'][data['to']]
    log('INFO', f'[{data["from"]}] sent an offer', data['meeting_name'])
    emit('offer', data, room=to_sid, skip_sid=request.sid)

@socketio.on('answer')
def handle_answer(data):
    to_sid = meetings[data['meeting_name']]['users'][data['to']]
    log('INFO', f'[{data["from"]}] sent an answer', data['meeting_name'])
    emit('answer', data, room=to_sid, skip_sid=request.sid)

@socketio.on('ice_candidate')
def handle_ice_candidate(data):
    to_sid = meetings[data['meeting_name']]['users'][data['to']]
    emit('ice_candidate', data, room=to_sid, skip_sid=request.sid)

if __name__ == '__main__':
    socketio.run(app, debug=True)
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS

def log(level: str, message: str, room=''):
    color_map = {
        'DEBUG': '\033[94m',
        'INFO': '\033[92m',
        'WARNING': '\033[93m',
        'ERROR': '\033[91m',
        'CRITICAL': '\033[41m',
        'RESET': '\033[0m'
    }

    color = color_map.get(level, color_map['RESET'])
    room = f"[{room}] " if room else ''
    print(f"{color}{level} {room}- {message}{color_map['RESET']}", flush=True)


app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False)

# TODO: create database file with in-memory SQLite3 and persistent db file
# TODO: setup sockets and routes

@app.route('/api/start-room', methods=['POST'])
def create_room():
    data = request.get_json()
    username = data['username']
    room_name = data['room_name']

    # TODO: create room memory session

    log('INFO', f'{username} created room {room_name}')

    return jsonify({'success': True})

if __name__ == '__main__':
    socketio.run(app, debug=True)
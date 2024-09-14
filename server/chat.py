from flask import jsonify, request
from flask_socketio import emit

def setup_chat(app, socketio, meetings):
    @app.route('/api/chat_history/<meeting_name>', methods=['GET'])
    def get_chat_history(meeting_name):
        if meeting_name not in meetings:
            return jsonify({'error': 'Meeting ID not found'}), 404
        return jsonify(meetings[meeting_name]['chat_history'])

    @socketio.on('chat_message')
    def handle_chat_message(data):
        meeting_name = data['meeting_name']
        sender = data['sender']
        message = data['text']

        if meeting_name not in meetings:
            emit('error', {'message': 'Meeting ID not found'}, to=request.sid)
            return
        
        meetings[meeting_name]['chat_history'].append({'sender': sender, 'text': message})
        emit('chat_message', {'sender': sender, 'text': message}, room=meeting_name)

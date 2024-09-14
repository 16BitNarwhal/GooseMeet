from flask import request
from flask_socketio import emit

def setup_webrtc(app, socketio, meetings):

    @socketio.on('offer')
    def handle_offer(data):
        to_sid = meetings[data['meeting_name']]['users'][data['to']]
        emit('offer', data, room=to_sid, skip_sid=request.sid)

    @socketio.on('answer')
    def handle_answer(data):
        to_sid = meetings[data['meeting_name']]['users'][data['to']]
        emit('answer', data, room=to_sid, skip_sid=request.sid)

    @socketio.on('ice_candidate')
    def handle_ice_candidate(data):
        to_sid = meetings[data['meeting_name']]['users'][data['to']]
        emit('ice_candidate', data, room=to_sid, skip_sid=request.sid)
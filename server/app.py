from flask import Flask, jsonify, request, send_file
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from chat import setup_chat
from webrtc import setup_webrtc
import os
from ai_conversation import get_ai_response
from speech_utils import text_to_speech
import tempfile
from openai import OpenAI
from pinecone import Pinecone
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

client = OpenAI()
pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
index_name = "conversation-history"
index = pc.Index(index_name)

def fetch_relevant_documents(user_text, meeting_name):
    embeddings = OpenAIEmbeddings(openai_api_key=os.environ["OPENAI_API_KEY"])
    vector_store = PineconeVectorStore(
        index=index, embedding=embeddings, text_key="text"
    )

    # Create a query embedding
    query_embedding = embeddings.embed_query(user_text)

    # Search for similar documents in Pinecone
    results = index.query(
        vector=query_embedding,
        top_k=3,  # Fetch top 3 most relevant documents
        include_metadata=True,
        filter={"meeting_name": meeting_name}  # Filter by meeting name
    )

    relevant_docs = []
    for match in results['matches']:
        relevant_docs.append(f"Document: {match['metadata']['text']}\nRelevance: {match['score']}")

    return "\n\n".join(relevant_docs)

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False)

# In-memory storage for each session
meetings = {}


# Setup routes and sockets
@app.route("/api/create-meeting", methods=["POST"])
def create_meeting():
    data = request.get_json()
    username = data["username"]
    meeting_name = data["meeting_name"]

    if username == "":
        return jsonify({"error": "Username cannot be empty"}), 400
    if meeting_name in meetings:
        return jsonify({"error": "Meeting ID already exists, please try again"}), 400

    meetings[meeting_name] = {
        "host": username,
        "users": {},  # {username: sid}
        "chat_history": [],  # [{sender: username, text: message}]
    }

    return jsonify({"meeting_name": meeting_name})


@app.route("/api/session/<meeting_name>", methods=["GET"])
def get_session(meeting_name):
    if meeting_name not in meetings:
        return jsonify({"error": "Meeting ID not found"}), 404
    return jsonify(meetings[meeting_name])


@app.route("/api/users/<meeting_name>", methods=["GET"])
def get_users(meeting_name):
    if meeting_name not in meetings:
        return jsonify({"error": "Meeting ID not found"}), 404
    if len(meetings[meeting_name]["users"]) > 7:
        return jsonify({"error": "Meeting is full"}), 404

    return jsonify(list(meetings[meeting_name]["users"].keys()))


@socketio.on("join")
def handle_join(data):
    if "username" not in data or "meeting_name" not in data:
        emit("error", {"message": "Missing username or meeting ID"}, to=request.sid)
        return

    meeting_name = data["meeting_name"]
    username = data["username"]
    join_room(meeting_name)
    session = meetings[meeting_name]
    session["users"][username] = request.sid

    emit(
        "user_joined",
        {"username": username, "meeting_name": meeting_name},
        room=meeting_name,
    )


@socketio.on("disconnect")
def handle_disconnect():
    to_delete = []
    for meeting_name, session in meetings.items():
        if request.sid in session["users"].values():
            username = [
                username
                for username, sid in session["users"].items()
                if sid == request.sid
            ][0]
            del session["users"][username]
            if len(session["users"]) == 0:
                to_delete.append(meeting_name)

            emit(
                "user_left",
                {"meeting_name": meeting_name, "username": username},
                room=meeting_name,
            )

    for meeting_name in to_delete:
        del meetings[meeting_name]


setup_chat(app, socketio, meetings)
setup_webrtc(app, socketio, meetings)


@app.route("/api/ai_response", methods=["POST"])
def ai_response():
    data = request.get_json()
    message = data["message"]
    conversation_history = data["conversation_history"]
    ai_response = get_ai_response(message, conversation_history)
    return jsonify({"response": ai_response})


@app.route("/api/goose_response", methods=["POST"])
def goose_response():
    data = request.get_json()
    user_text = data["text"]
    meeting_name = data["meeting_name"]
    
    if meeting_name not in meetings:
        return jsonify({'error': 'Meeting not found'}), 404
    
    # Fetch conversation history and relevant documents
    conversation_history = meetings[meeting_name]['chat_history']
    relevant_docs = fetch_relevant_documents(user_text, meeting_name)
    
    # Combine user input, conversation history, and relevant documents
    context = f"Relevant information: {relevant_docs}\n\nConversation history: {conversation_history}\n\nUser: {user_text}"
    
    ai_response = get_ai_response(context, [])
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
        temp_filename = temp_file.name
    
    text_to_speech(ai_response, temp_filename)
    
    return send_file(temp_filename, mimetype='audio/mpeg', as_attachment=True)


@app.route("/api/update_chat_history", methods=["POST"])
def update_chat_history():
    data = request.get_json()
    meeting_name = data["meeting_name"]
    chat_history = data["chat_history"]

    meetings[meeting_name]["chat_history"] = chat_history

    return jsonify({"status": "success"})


if __name__ == "__main__":
    if os.getenv("TESTING", True):
        socketio.run(app, debug=True, allow_unsafe_werkzeug=True)
    else:
        socketio.run(app, debug=True)

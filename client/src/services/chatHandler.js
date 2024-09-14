const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ChatHandler {
  constructor(meeting_name, username, socket, setChatHistory, onError) {
    this.meeting_name = meeting_name;
    this.username = username;
    this.socket = socket;
    this.chatHistory = [];
    this.setChatHistory = setChatHistory;
    this.onError = onError;
  }

  async initialize() {
    this.setupSocketListeners();
    const response = await fetch(`${apiUrl}/api/chat_history/${this.meeting_name}`)
    if (!response.ok) {
      return;
    }
    this.chatHistory = await response.json();
    if (this.setChatHistory) {
      this.setChatHistory([...this.chatHistory]); // update UI
    }
  }

  setupSocketListeners() {
    this.socket.on('chat_message', (data) => {
      console.log("WebSocket event received:", data);
      this.chatHistory.push(data);
      if (this.setChatHistory) {
        this.setChatHistory([...this.chatHistory]); // update UI
      }
    });
  }

  sendMessage(text) {
    this.socket.emit('chat_message', { meeting_name: this.meeting_name, text: text, sender: this.username });
  }

  setChatHistoryListener(listener) {
    this.setChatHistory = listener;
  }
}

export default ChatHandler;

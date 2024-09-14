import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function get_ai_response(message, conversation_history) {
  try {
    const response = await axios.post(`${apiUrl}/api/ai_response`, {
      message,
      conversation_history
    });
    return response.data.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
}

class AIHandler {
  constructor(meeting_name, username, socket, setChatHistory) {
    this.meeting_name = meeting_name;
    this.username = username;
    this.socket = socket;
    this.setChatHistory = setChatHistory;
    this.conversation_history = [];
  }

  async processUserMessage(message) {
    try {
      this.conversation_history.push({ role: 'user', content: message });
      const aiResponse = await get_ai_response(message, this.conversation_history);
      this.conversation_history.push({ role: 'assistant', content: aiResponse });
      this.sendAIMessage(aiResponse);
      
      // Update the chat history in the backend
      await this.updateChatHistory();
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  }

  async updateChatHistory() {
    try {
      await axios.post(`${apiUrl}/api/update_chat_history`, {
        meeting_name: this.meeting_name,
        chat_history: this.conversation_history
      });
    } catch (error) {
      console.error('Error updating chat history:', error);
    }
  }

  sendAIMessage(message) {
    this.socket.emit('chat_message', {
      meeting_name: this.meeting_name,
      text: message,
      sender: 'Mr. Goose'
    });
    this.setChatHistory(prevHistory => [
      ...prevHistory,
      { sender: 'Mr. Goose', text: message }
    ]);
  }
}

export default AIHandler;

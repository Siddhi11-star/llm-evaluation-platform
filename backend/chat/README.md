# 💬 JudgeAI Chat Backend Service (MiniMax M3 + MongoDB)

This is the dedicated backend service for the **Chat** feature in JudgeAI, powered by the **MiniMax M3 / MiniMax-Text-01 Cloud Model** and **MongoDB** for conversational history persistence.

---

## 🚀 Features
- **MiniMax M3 Cloud Integration**: Connects to MiniMax's flagship reasoning model for high-accuracy, structured responses with zero hallucination.
- **MongoDB Chat History Persistence**:
  - `chat_sessions`: Stores conversation threads, titles, model tags, and timestamps.
  - `chat_messages`: Stores message streams (user & assistant) indexed by `session_id` and `timestamp`.
  - Automatic in-memory fallback if MongoDB is not active during local development.
- **FastAPI Endpoints**:
  - `POST /chat/message`: Send user prompt, stream/fetch MiniMax M3 completion, and persist dialogue.
  - `GET /chat/sessions`: Retrieve all historical chat sessions.
  - `GET /chat/sessions/{session_id}`: Retrieve message history for a specific conversation.
  - `PUT /chat/sessions/{session_id}`: Rename a chat session.
  - `DELETE /chat/sessions/{session_id}`: Delete a session and its messages.
  - `GET /chat/health`: Check status of MiniMax API and MongoDB connection.

---

## 🛠️ Setup & Installation

### 1. Install Dependencies
```bash
cd backend/chat
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and provide your MiniMax credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```env
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
MINIMAX_BASE_URL=https://api.minimax.chat/v1
MINIMAX_MODEL=MiniMax-Text-01

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=judgeai_chat

HOST=0.0.0.0
PORT=8000
```

### 3. Run Server
```bash
uvicorn backend.chat.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => console.log("Connected to server"));
    socket.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("user_list", (list) => setUsers(list));
    socket.on("typing_users", (list) => setTypingUsers(list));
    return () => socket.disconnect();
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send_message", message);
      setMessage("");
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", e.target.value.length > 0);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Enter your name</h1>
        <input
          type="text"
          className="px-4 py-2 rounded border border-gray-300 mb-4 w-64 text-gray-900"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your name..."
        />
        <button
          onClick={() => {
            socket.emit("user_join", username);
            setIsConnected(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold"
        >
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Chat Room</h1>

      {/* Online users */}
      <div className="w-full max-w-md mb-4 bg-white shadow rounded p-4">
        <h2 className="font-semibold text-gray-700 mb-2">Online Users:</h2>
        <ul className="space-y-1">
          {users.map((u) => (
            <li key={u.id} className="text-gray-800">{u.username}</li>
          ))}
        </ul>
      </div>

      {/* Messages */}
      <div className="w-full max-w-md bg-white shadow rounded-lg p-4 flex flex-col space-y-4">
        <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className="mb-2">
              <span className="font-semibold text-blue-600">{msg.sender || "Anon"}:</span>{" "}
              <span className="text-gray-800">{msg.message}</span>
              <div className="text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="text-sm text-gray-500 italic">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            value={message}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-900"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);

  const connect = (username) => {
    if (!username) return;

    socketRef.current = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000");
    
    socketRef.current.on("connect", () => {
      setIsConnected(true);
      socketRef.current.emit("user_join", username);
    });

    socketRef.current.on("user_list", (data) => setUsers(data));
    socketRef.current.on("user_joined", (data) => {
      setMessages((prev) => [...prev, { id: Date.now(), message: `${data.username} joined the chat`, system: true }]);
    });
    socketRef.current.on("user_left", (data) => {
      setMessages((prev) => [...prev, { id: Date.now(), message: `${data.username} left the chat`, system: true }]);
    });

    socketRef.current.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    socketRef.current.on("private_message", (msg) => setMessages((prev) => [...prev, { ...msg, private: true }]));
    socketRef.current.on("typing_users", (data) => setTypingUsers(data));
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      setIsConnected(false);
      setUsers([]);
      setMessages([]);
      setTypingUsers([]);
    }
  };

  const sendMessage = (message) => {
    socketRef.current.emit("send_message", message);
  };

  const sendPrivateMessage = (to, message) => {
    socketRef.current.emit("private_message", { to, message });
  };

  const sendTyping = (isTyping) => {
    socketRef.current.emit("typing", isTyping);
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return { connect, disconnect, sendMessage, sendPrivateMessage, sendTyping, messages, users, typingUsers, isConnected };
}

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import api from "../api/api";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Message {
  _id?: string;
  content: string;
  senderId: string;
  senderName?: string;
  teamId: string;
  createdAt?: string;
}
// ... (baki imports same rakhein)

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [user, setUser] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. SOCKET INITIALIZATION
  useEffect(() => {
    const SOCKET_URL =
      import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : import.meta.env.VITE_SOCKET_URL;

    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current.on("receiveMessage", (msg: Message) => {
      // ONLY add if it's from someone else.
      // Your own messages are added via sendMessage (Optimistic UI)
      setMessages((prev) => {
        const isFromMe = String(msg.senderId) === String(user?._id);
        if (isFromMe) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?._id]); // Re-bind listener if user ID changes to ensure 'isFromMe' works

  // 2. JOIN TEAM ROOM (Fixes the race condition)
  useEffect(() => {
    if (user?.teamId && socketRef.current) {
      socketRef.current.emit("joinTeam", user.teamId);
    }
  }, [user?.teamId, socketRef.current]);

  // 3. AUTH & HISTORY
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) return setUser(null);
      try {
        const res = await api.post("/users/login", { email: fbUser.email });
        const userData = res.data.user;
        setUser(userData);

        if (userData.teamId) {
          const msgs = await api.get<Message[]>(
            `/messages?teamId=${userData.teamId}`,
            {
              headers: { role: userData.role, userid: String(userData._id) },
            },
          );
          setMessages(msgs.data);
        }
      } catch (err: any) {
        console.error("Auth error:", err.message);
      }
    });
    return () => unsubscribe();
  }, []);

  const sendMessage = () => {
    if (!newMsg.trim() || !user || !socketRef.current) return;

    const payload: Message = {
      content: newMsg,
      senderId: String(user._id),
      senderName: user.name,
      teamId: user.teamId,
      createdAt: new Date().toISOString(),
    };

    socketRef.current.emit("sendMessage", payload);
    setMessages((prev) => [...prev, payload]); // Optimistic Update
    setNewMsg("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
            Team Chat
          </h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Live Workspace
          </p>
        </div>
        <span className="text-[10px] bg-indigo-600 px-3 py-1 rounded-full font-bold text-white uppercase tracking-widest animate-pulse">
          Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          // SABSE ZAROORI LINE: String conversion for perfect matching
          const isMe = String(msg.senderId) === String(user?._id);

          return (
            <div
              key={idx}
              className={`flex flex-col ${isMe ? "items-end text-right" : "items-start text-left"} animate-in fade-in slide-in-from-bottom-1`}
            >
              <span className="text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wider px-1">
                {isMe ? "You" : msg.senderName} •{" "}
                {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <div
                className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-sm shadow-md ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-tr-none border border-indigo-500"
                    : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2 bg-gray-950 p-2 rounded-2xl border border-gray-700 focus-within:border-indigo-500 transition-all">
          <input
            className="flex-1 bg-transparent px-4 py-2 outline-none text-white text-sm"
            placeholder="Type your message..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)} // Corrected to e.target.value
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

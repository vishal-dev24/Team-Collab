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

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [user, setUser] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------------- SOCKET CONNECTION ----------------
  useEffect(() => {
    const SOCKET_URL =
      import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : import.meta.env.VITE_SOCKET_URL;

    // Fixed: Added polling fallback for Render/Cloud hosting stability
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socketRef.current.on("receiveMessage", (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate: agar message ID ya content/sender match kare toh add mat karo
        const isDuplicate = prev.some(
          (m) =>
            (m._id && m._id === msg._id) ||
            (m.content === msg.content &&
              m.senderId === msg.senderId &&
              !m._id),
        );
        if (isDuplicate) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // ---------------- AUTH & FETCH HISTORY ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        return;
      }

      // Avoid re-fetching if user already exists
      if (user) return;

      try {
        const res = await api.post("/users/login", { email: fbUser.email });
        const userData = res.data.user;
        setUser(userData);

        if (userData.teamId && socketRef.current) {
          socketRef.current.emit("joinTeam", userData.teamId);
        }

        if (userData.teamId) {
          const msgs = await api.get<Message[]>(
            `/messages?teamId=${userData.teamId}`,
            {
              headers: { role: userData.role, userid: userData._id },
            },
          );
          setMessages(msgs.data);
        }
      } catch (err: any) {
        console.error("Auth error:", err.message);
      }
    });

    return () => unsubscribe();
  }, [user]); // Added user dependency to prevent infinite loops

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- SEND MESSAGE (FIXED) ----------------
  const sendMessage = () => {
    if (!newMsg.trim() || !user || !socketRef.current) return;

    const payload = {
      content: newMsg,
      senderId: user._id,
      senderName: user.name,
      teamId: user.teamId,
    };

    // Optimistic Update: Idhar humne tempId ko hatakar direct payload use kiya hai
    setMessages((prev) => [
      ...prev,
      { ...payload, createdAt: new Date().toISOString() },
    ]);

    // Socket emit
    socketRef.current.emit("sendMessage", payload);

    setNewMsg("");
  };

  return (
    // ... (Aapka baki UI code same rahega)
    <div className="flex flex-col h-[calc(100vh-160px)] bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === user?._id;
          return (
            <div
              key={idx}
              className={`flex flex-col ${isMe ? "items-end text-right" : "items-start text-left"} animate-in fade-in slide-in-from-bottom-1 duration-300`}
            >
              <span className="text-[9px] font-bold text-gray-500 mb-1 uppercase tracking-wider px-1">
                {isMe ? "You" : msg.senderName} •{" "}
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Just now"}
              </span>
              <div
                className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-sm shadow-md leading-relaxed ${isMe ? "bg-indigo-600 text-white rounded-tr-none border border-indigo-500 shadow-indigo-500/20" : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"}`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2 bg-gray-950 p-2 rounded-2xl border border-gray-700 focus-within:border-indigo-500 transition-all">
          <input
            className="flex-1 bg-transparent px-4 py-2 outline-none text-white text-sm"
            placeholder="Type your message..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

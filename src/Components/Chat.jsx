import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { io } from "socket.io-client"

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { memberName, roomCode } = location.state
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [input, setInput] = useState("")
  const [roomInfo, setRoomInfo] = useState({ grpName: "", adminName: "" })
  const [abandonBox,setAbandonBox] = useState(false);
  const [tempWords, setTempWords] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState("all");

  const socketRef = useRef(null)

  useEffect(() => {
    fetch(`/api/getRoomInfo?roomCode=${roomCode}`)
      .then((res) => res.json())
      .then((data) => setRoomInfo(data))
      .catch(console.error)

    const socket = io("http://localhost:3000")
    socketRef.current = socket

    socket.emit("joinRoom", { roomCode, memberName })

    socket.on("notification", (note) => {
      setNotifications((prev) => [...prev, note])
    })

    socket.on("chat_message", (data) => {
      setMessages((prev) => [...prev, data])
    })

    socket.on("chat_history", (history) => {
      setMessages(history);
    });

    socket.on("update_members", (list) => setMembers(list));

    return () => {
      socket.disconnect()
    }
  }, [roomCode, memberName])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    socketRef.current.emit("chat_message", { roomCode, message: input })
    setInput("")
  }

  const removeMember = async (memberName) => {
  await fetch(`/api/removeMember`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, memberName, adminName:roomInfo.adminName })
  });
};

useEffect(() => {
  const socket = socketRef.current;
  if (!socket) return;

  socket.on("removed_from_room", (data) => {
    const removedName = data?.name;
    if (removedName === memberName) { 
      alert(`${removedName}, you have been removed by the admin`);
      navigate("/"); 
    }
  });

  return () => {
    socket.off("removed_from_room");
  };
}, [navigate, memberName]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6" style={{ backgroundImage: "radial-gradient(ellipse at top, #1e293b, #020617)" }}>
      
      {/* Main Chat Container */}
      <div className="w-full max-w-5xl h-full max-h-[90vh] flex flex-col bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/40">
          <div className="flex items-center gap-3 w-full sm:w-auto mb-3 sm:mb-0 justify-between sm:justify-start">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {roomInfo.grpName || "Chat Room"}
            </h2>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-800 border border-slate-600/50 text-slate-300">
              Admin: {roomInfo.adminName}
            </span>
          </div>

          <div className="flex justify-end flex-wrap gap-2 items-center w-full sm:w-auto">
            {roomInfo.adminName === memberName && (
              <>
                <button onClick={() => {const name = prompt("Enter member name to remove");if (name) removeMember(name);}} className="text-xs font-medium px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                  Remove User
                </button>
                <button onClick={() => setAbandonBox(!abandonBox)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  Banned Words
                </button>
                <button onClick={async () => {
                  const newLockState = !roomInfo.isLocked;
                  await fetch(`/api/toggleLock`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roomCode, isLocked: newLockState })
                  });
                  setRoomInfo(prev => ({ ...prev, isLocked: newLockState }));
                }} className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                  {roomInfo.isLocked ? "Unlock Room" : "Lock Room"}
                </button>
                <button onClick={async () => {
                  const limit = prompt("Enter message limit per user (0 for no limit):", roomInfo.messageLimit || 0);
                  if (limit !== null && !isNaN(limit)) {
                    await fetch(`/api/setMessageLimit`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ roomCode, limit: parseInt(limit) })
                    });
                    setRoomInfo(prev => ({ ...prev, messageLimit: parseInt(limit) }));
                  }
                }} className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                  Set Limit
                </button>
                {roomInfo.messageLimit > 0 && (
                  <button onClick={() => socketRef.current.emit("admin_seen", { roomCode })} className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    Mark Seen
                  </button>
                )}
              </>
            )}
            <button onClick={() => navigate("/")} className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 hover:bg-slate-600 transition-colors ml-2 sm:ml-4 border border-slate-600">
              Leave
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
          {notifications.map((note, idx) => (
            <div key={`note-${idx}`} className="flex justify-center my-2">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-400 shadow-sm backdrop-blur-md">
                {note}
              </span>
            </div>
          ))}

          {messages.map((msg, idx) => {
            const isSelf = msg.isSelf || msg.username === memberName;
            return (
              <div key={`msg-${idx}`} className={`flex flex-col w-max max-w-[85%] sm:max-w-[70%] ${isSelf ? "self-end items-end ml-auto" : "self-start items-start mr-auto"}`}>
                <span className="text-[11px] font-medium text-slate-400 mb-1 px-1">
                  {isSelf ? "You" : msg.username}
                </span>
                <div className={`px-4 py-2.5 shadow-md ${
                  isSelf 
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[20px] rounded-tr-[4px]" 
                  : "bg-slate-800 border border-slate-700/50 text-slate-100 rounded-[20px] rounded-tl-[4px]"
                }`}>
                  <p className="text-sm sm:text-base leading-relaxed break-words">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-800/60 border-t border-slate-700/50">
          <form onSubmit={sendMessage} className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900/50 border border-slate-600/50 rounded-full px-5 py-3 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
            />
            <button type="submit" disabled={!input.trim()} className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-full h-11 w-11 sm:h-12 sm:w-auto sm:px-6 sm:rounded-full transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              <span className="hidden sm:block font-medium">Send</span>
              <svg className="w-5 h-5 sm:hidden ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </div>

        {/* Abandon Words Modal */}
        {abandonBox && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-white text-center">🚫 Manage Banned Words</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-300">Target User</label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all">All Members</option>
                    {members.filter(m => m !== roomInfo.adminName).map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-slate-300">Words to Ban</label>
                  <input
                    type="text"
                    value={tempWords}
                    onChange={(e) => setTempWords(e.target.value)}
                    placeholder="bad, restricted, words"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3 mt-8">
                <button
                  onClick={() => setAbandonBox(false)}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/removeBannedWords`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ roomCode, target: selectedTarget })
                    });
                    alert("✅ Restrictions withdrawn!");
                    setAbandonBox(false);
                  }}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-colors font-medium text-sm"
                >
                  Clear All
                </button>
                <button
                  onClick={async () => {
                    if (!tempWords.trim()) {
                      alert("No words specified.");
                      return;
                    }
                    await fetch(`/api/setBannedWords`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        roomCode,
                        target: selectedTarget,
                        words: tempWords.split(",").map(w => w.trim().toLowerCase())
                      })
                    });
                    alert("🚫 Words banned successfully!");
                    setTempWords("");
                    setAbandonBox(false);
                  }}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium shadow-lg text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

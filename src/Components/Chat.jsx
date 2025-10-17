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
  const [bannedWords, setBannedWords] = useState([]);
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

    socket.on("delete_message", (msgId) => {
  setMessages(prev => prev.filter(msg => msg.id !== msgId));
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
  await fetch("/api/removeMember", {
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

const handleAbandonSubmit = () => {
    const words = tempWords
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    setBannedWords(words);
    setAbandonBox(false);
    setTempWords("");
    alert("🚫 Banned words added successfully!");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-black">
      <div className="flex items-center justify-between p-4 border-b bg-blue-500 text-white">
        <h2 className="text-xl font-semibold">{roomInfo.grpName}</h2>
        <span>Admin: {roomInfo.adminName}</span>
        <button onClick={() => {
    const name = prompt("Enter member name to remove");
    if (name) removeMember(name);
  }}>remove</button>
  <button onClick={()=>{setAbandonBox(!abandonBox)}}>Abandon words</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.map((note, idx) => (
          <div key={idx} className="text-gray-500 italic text-sm">
            {note}
          </div>
        ))}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-md max-w-[70%] ${
              msg.isSelf
                ? "bg-blue-100 self-end ml-auto"
                : "bg-gray-200 self-start mr-auto"
            }`}
          >
            <span className="font-semibold">{msg.username}: </span>
            {msg.message}
          </div>
        ))}
      </div>

      <form
        onSubmit={sendMessage}
        className="flex border-t border-gray-300 p-4 space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2 outline-none"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </form>
      {abandonBox && (
  <div className="inset-0 fixed bg-black/40 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-lg font-semibold mb-2 text-center">🚫 Add Banned Words</h2>

      <label className="block mb-2 text-sm">Select Target:</label>
      <select
        value={selectedTarget}
        onChange={(e) => setSelectedTarget(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      >
        <option value="all">All Members</option>
        {members.map((m, i) => (
          <option key={i} value={m}>{m}</option>
        ))}
      </select>

      <input
        type="text"
        value={tempWords}
        onChange={(e) => setTempWords(e.target.value)}
        placeholder="Enter comma-separated words (e.g. bad, rude)"
        className="w-full border rounded px-3 py-2 mb-4"
      />

      <div className="flex justify-between">
        <button
          onClick={async () => {
            await fetch("/api/setBannedWords", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomCode,
                target: selectedTarget,
                words: tempWords.split(",").map(w => w.trim().toLowerCase())
              })
            });
            alert("🚫 Restrictions applied successfully!");
            setTempWords("");
            setAbandonBox(false);
          }}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Done
        </button>

        <button
          onClick={async () => {
            await fetch("/api/removeBannedWords", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomCode, target: selectedTarget })
            });
            alert("✅ Restrictions withdrawn!");
            setAbandonBox(false);
          }}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Withdraw
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

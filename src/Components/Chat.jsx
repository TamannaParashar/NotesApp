import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { io } from "socket.io-client"

export default function Chat() {
  const location = useLocation()
  const { memberName, roomCode } = location.state
  const [messages, setMessages] = useState([])
  const [notifications, setNotifications] = useState([])
  const [input, setInput] = useState("")
  const [roomInfo, setRoomInfo] = useState({ grpName: "", adminName: "" })

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

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-black">
      <div className="flex items-center justify-between p-4 border-b bg-blue-500 text-white">
        <h2 className="text-xl font-semibold">{roomInfo.grpName}</h2>
        <span>Admin: {roomInfo.adminName}</span>
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
    </div>
  )
}

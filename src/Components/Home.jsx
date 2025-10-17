"use client"

import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

function OrbitingImage() {
  return (
    <div className="orbit-container mx-auto">
      <img src="pic1.jpg" alt="User profile" className="orbit-image" />
      <div className="orbit-ring" aria-hidden="true" />
      <div className="orbit-spin" aria-hidden="true">
        <div className="orbit-badge orbit-top">
          <span>Privacy🔒</span>
        </div>
        <div className="orbit-badge orbit-right">
          <span>User-friendly🤝</span>
        </div>
        <div className="orbit-badge orbit-bottom">
          <span>Professional🧑‍💼</span>
        </div>
        <div className="orbit-badge orbit-left">
          <span>Friends👫</span>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, desc, shown, delay = 0, img }) {
  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/5 p-0 backdrop-blur-sm transition-all will-change-transform hover:-translate-y-1 card-bg"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(18px)",
        transition: "opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)",
        transitionDelay: `${delay}ms`,
        backgroundImage: `url('${img}')`,
      }}
      aria-live="polite"
    >
      {/* overlay for readability */}
      <div className="card-overlay" aria-hidden="true" />
      <div className="relative p-6">
        <div className="mb-4 h-10 w-10 rounded-md border border-white/25 bg-white/20 backdrop-blur-[2px]" aria-hidden />
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-white/90">{desc}</p>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -inset-20 rotate-12 bg-white/5 blur-2xl" aria-hidden />
      </div>
    </article>
  )
}

function PenDoodle() {
  return (
    <div className="pen-doodle" aria-hidden="true">
      <svg viewBox="0 0 800 120" preserveAspectRatio="none" className="pointer-events-none">
        <path
          d="M10,30 C200,10 300,110 520,70 C640,50 720,40 790,85"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeDasharray="6 10"
          opacity="0.9"
        />
      </svg>
      <svg className="pen-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 22l4.5-1.2L20.2 7.1a2.2 2.2 0 0 0 0-3.1l-0.2-0.2a2.2 2.2 0 0 0-3.1 0L3.2 17.6 2 22z" fill="white" />
        <path d="M16.9 3.8l3.3 3.3" stroke="#00538C" strokeWidth="2" />
      </svg>
    </div>
  )
}

export default function Home() {
  const featuresRef = useRef(null)
  const [isInView, setIsInView] = useState(false)
  const [revealed, setRevealed] = useState([false, false, false])
  const [join, setJoin] = useState(false)
  const [create, setCreate] = useState(false)
  const [code, setCode] = useState(["", "", "", "", ""])
  const [groupName, setGroupName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [membersCount, setMembersCount] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [memberName, setMemberName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const navigate = useNavigate();

  const generateRoomCode = () => {
    if(groupName==="" || adminName==="" || membersCount===""){
        alert("Enter the required information first")
        return;
    }
    const codeGen = Math.floor(10000 + Math.random() * 90000).toString()
    setRoomCode(codeGen)
  }

  useEffect(() => {
    const el = featuresRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsInView(true)
        })
      },
      { root: null, threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return
    const timers = [0, 1, 2].map((i) =>
      setTimeout(() => {
        setRevealed((prev) => {
          if (prev[i]) return prev
          const next = [...prev]
          next[i] = true
          return next
        })
      }, i * 220),
    )
    return () => timers.forEach((t) => clearTimeout(t))
  }, [isInView])

  const handleChange = (value, index) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
  }

  const handleCreateRoom=async()=>{
    const res = await fetch("/api/addCreateRoomInfo",{
        method:"Post",
        headers: {"Content-Type": "application/json"},
        body:JSON.stringify({
            groupName,
            adminName,
            membersCount,
            roomCode
        })
    });
    const data = await res.json();
    console.log(data);
    setGroupName("");
    setAdminName("");
    setMembersCount("");
    setRoomCode("");
    setCreate(false);
    alert("Data saved")
  }

  const handleJoinRoom=async()=>{
    const joinedCode = code.join("");
    setJoinCode(joinedCode);
    const res = await fetch("/api/joinRoom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: joinedCode, name: memberName })
    });
    if(res.status===400){
      alert("Room is full");
      return;
    }
    if(res.status===403){
      alert("Room has been locked by the admin");
      return;
    }
    if(res.status===404){
      alert("Wrong code! Room does not exist")
      return;
    }
    if(!res.ok){
      alert("Some error occured. Please try after some time")
      return;
    }
    const data = await res.json();
    console.log(data);
    navigate('/chat',{state:{memberName, roomCode: joinedCode}})
    setMemberName("");
    setCode(["", "", "", "", ""]);
    setJoin(false);
    alert("You'll be joining room now")
  }

  const features = [
    {
      title: "Privacy",
      desc: "Chats don't get stored, maintaining your privacy is our duty.",
      img: "feature-1.jpg",
    },
    {
      title: "Words Control",
      desc: "Abandon certain words usage in chat as per your choice.",
      img: "feature-2.jpg",
    },
    {
      title: "Secure by Default",
      desc: "Private rooms, share links with control, and data encrypted in transit.",
      img: "feature-3.jpg",
    },
  ]

  return (
    <div className="min-h-screen w-full text-white" style={{ backgroundColor: "#00538C" }}>
      <header
        className="mx-auto flex w-full items-center justify-between px-6 py-5 bg-white"
        style={{ color: "#00538C", border: "3px solid #00538C" }}
      >
        <nav className="flex gap-6 sm:flex">
          <a href="#features" className="text-#00538C font-semibold">Features</a>
          <a href="#" className="text-#00538C font-semibold">About</a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6">
        <section className="flex flex-col gap-10 py-16 sm:py-24 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-wide">
              {Array.from("NotesApp").map((ch, i) => (
                <span
                  key={i}
                  className="inline-block animate-drop-in"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: "2s",
                  }}
                >
                  {ch}
                </span>
              ))}
            </h1>

            <PenDoodle />

            <p className="mt-4 max-w-2xl text-pretty text-white/90 sm:text-lg">
              Fast, collaborative, and secure chat rooms. Jump into a room with your team or create a new space in
              seconds—stay in flow and ship ideas faster.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                id="join"
                onClick={() => setJoin(!join)}
                className="rounded-md border border-white/70 px-5 py-3 font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#00538C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Join Room
              </button>
              <button
                id="create"
                onClick={() => setCreate(!create)}
                className="rounded-md border border-white/70 px-5 py-3 font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#00538C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Create Room
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <OrbitingImage />
          </div>
        </section>

        {/* Join modal */}
        {join && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
            <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/15 p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.35)] backdrop-blur-xl transition-all scale-100">
            <input
                  type="text"
                  placeholder="Your Name"
                  className="px-4 py-3 rounded-lg border border-white/70 bg-white/10 text-white placeholder-white/70 outline-none focus:border-white focus:bg-white focus:text-[#00538C] transition-all w-full"
                   value={memberName} required
                  onChange={(e) => setMemberName(e.target.value)}
                />
              <h2 className="text-2xl font-semibold text-center mb-6 text-white mt-6">Enter the Code</h2>
              <div className="flex justify-center gap-4">
                {code.map((c, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={c}
                    onChange={(e) => handleChange(e.target.value, i)}
                    className="h-14 w-14 text-center text-2xl font-semibold rounded-lg border border-white/70 bg-white/10 text-white outline-none transition-all focus:border-white focus:bg-white focus:text-[#00538C]"
                    aria-label={`Code character ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setJoin(false)}
                  className="mt-8 w-full rounded-md border border-white/70 px-5 py-3 font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#00538C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 m-2"
                >
                  Close
                </button>
                <button className="mt-8 w-full rounded-md border border-white/70 px-5 py-3 font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#00538C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 m-2" onClick={handleJoinRoom}>
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create modal */}
        {create && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
            <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/15 p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.35)] backdrop-blur-xl transition-all">
              <h2 className="text-2xl font-semibold text-center mb-6 text-white">Create Room</h2>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Group Name"
                  className="px-4 py-3 rounded-lg border border-white/70 bg-white/10 text-white placeholder-white/70 outline-none focus:border-white focus:bg-white focus:text-[#00538C] transition-all"
                  value={groupName} required
                  onChange={(e) => setGroupName(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Your Name (Admin)"
                  className="px-4 py-3 rounded-lg border border-white/70 bg-white/10 text-white placeholder-white/70 outline-none focus:border-white focus:bg-white focus:text-[#00538C] transition-all"
                  value={adminName} required
                  onChange={(e) => setAdminName(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Number of Members"
                  className="px-4 py-3 rounded-lg border border-white/70 bg-white/10 text-white placeholder-white/70 outline-none focus:border-white focus:bg-white focus:text-[#00538C] transition-all"
                  value={membersCount} required
                  onChange={(e) => setMembersCount(e.target.value)}
                />
              </div>

              {roomCode && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <p className="text-white">Your Room Code:</p>
                  <div className="flex gap-2 text-lg font-bold text-white">
                    {roomCode.split("").map((digit, i) => (
                      <span
                        key={i}
                        className="h-12 w-12 flex items-center justify-center rounded-lg border border-white/70 bg-white/10"
                      >
                        {digit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={generateRoomCode}
                  className="flex-1 rounded-md border border-white/70 px-5 py-3 font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#00538C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Generate Code
                </button>
                <button
                  onClick={async() => {await handleCreateRoom();setCreate(false)}}
                  className="flex-1 rounded-md border border-white/70 px-5 py-3 font-medium text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#00538C] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <section id="features" ref={featuresRef} className="pb-20 sm:pb-28">
          <h2 className="mb-6 text-3xl font-semibold sm:text-3xl text-center">Features</h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} title={f.title} desc={f.desc} img={f.img} shown={revealed[i]} delay={i * 40} />
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-6">
        <p className="text-sm text-white/70 text-center">© {new Date().getFullYear()} NotesApp Tamanna Parashar</p>
      </footer>
    </div>
  )
}

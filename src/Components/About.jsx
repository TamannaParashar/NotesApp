export default function About() {
  const features = [
    {
      title: "Room Creation & Joining",
      description:
        "Create private chat rooms with customizable member limits. Generate unique 5-digit room codes for easy access control.",
    },
    {
      title: "Admin Controls",
      description:
        "Manage members, lock rooms, and set banned words. Full control over room moderation and member restrictions.",
    },
    {
      title: "Smart Chat Features",
      description:
        "Timed messages that auto-disappear, real-time notifications, and a modern themed UI for seamless communication.",
    },
  ]

  const techStack = [
    { name: "React.js", category: "Frontend" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Node.js", category: "Backend" },
    { name: "Express", category: "Framework" },
    { name: "Socket.IO", category: "Real-time" },
    { name: "MongoDB", category: "Database" },
  ]

  const enhancements = [
    "Chat history persistence",
    "Private one-to-one messaging",
    "Media (image/file) sharing",
    "Admin transfer functionality",
  ]

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#00538C" }}>
      <section className="relative px-4 sm:px-6 lg:px-8 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance text-white">
            Real-time Collaboration Made Simple
          </h1>
          <p className="mb-8 text-lg text-white/80 sm:text-xl text-balance max-w-2xl mx-auto">
            NotesApp enables fast, secure, and collaborative communication using Socket.IO, Node.js, Express, and React
            — ensuring real-time updates and a smooth chatting experience.
          </p>
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl text-white">Core Features</h2>
            <p className="text-white/70">Everything you need for seamless team communication</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, idx) => {
              return (
                <div
                  key={idx}
                  className="group rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-8 transition-all duration-300 hover:border-white/40 hover:bg-white/15 hover:shadow-xl hover:shadow-white/10 hover:-translate-y-1"
                >
                  <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-8 sm:p-12 transition-all hover:border-white/30 hover:bg-white/15">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">Admin Controls</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all">
                <h3 className="mb-2 font-semibold text-white">Remove Members</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  The admin can remove any member at any time. Removed members are instantly notified and redirected out
                  of the room.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all">
                <h3 className="mb-2 font-semibold text-white">Lock Room</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Prevent new members from joining by locking the room. Users attempting to join receive a clear
                  notification.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all">
                <h3 className="mb-2 font-semibold text-white">Banned Words</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Set prohibited words for all members or specific individuals. Messages containing banned words won't
                  be sent.
                </p>
              </div>
              <div className="rounded-lg bg-white/5 p-4 border border-white/10 hover:border-white/20 transition-all">
                <h3 className="mb-2 font-semibold text-white">Real-time Notifications</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  All members receive instant updates on admin actions, member joins/leaves, and room status changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl text-white">Smart Chat Features</h2>
            <p className="text-white/70">Advanced capabilities for modern communication</p>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-6 transition-all hover:border-white/40 hover:bg-white/15 hover:shadow-lg hover:shadow-white/10">
              <div>
                <h3 className="font-semibold text-white">Timed Messages</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Chats automatically disappear after a set duration for enhanced privacy.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-6 transition-all hover:border-white/40 hover:bg-white/15 hover:shadow-lg hover:shadow-white/10">
              <div>
                <h3 className="font-semibold text-white">Real-time Notifications</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Instant updates for new messages, member activity, and admin actions.
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-6 transition-all hover:border-white/40 hover:bg-white/15 hover:shadow-lg hover:shadow-white/10">
              <div>
                <h3 className="font-semibold text-white">Modern UI</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Soft blended gradient design for a lively and professional chat interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl text-white">Tech Stack</h2>
            <p className="text-white/70">Built with modern, reliable technologies</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((tech, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm p-6 text-center transition-all hover:border-white/40 hover:bg-white/15 hover:shadow-lg hover:shadow-white/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{tech.category}</p>
                <p className="mt-2 text-lg font-semibold text-white">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-white/20 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm p-8 sm:p-12 hover:border-white/30 transition-all">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-3xl font-bold text-white">Future Enhancements</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {enhancements.map((enhancement, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-white/80 leading-relaxed">{enhancement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

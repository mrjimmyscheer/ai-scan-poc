export default function Navbar({ onHome }) {
  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <div className="text-xl font-bold text-purple-400">AI Scan voor Docenten</div>
      <div className="flex items-center gap-4">
        <button
          onClick={onHome}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition"
        >
          Home
        </button>
      </div>
    </nav>
  );
}

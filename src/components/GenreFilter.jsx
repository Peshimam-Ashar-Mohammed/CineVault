export default function GenreFilter({ genres, activeGenre, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !activeGenre
            ? "bg-red-600 text-white"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
        }`}
      >
        All
      </button>
      {genres.map((g) => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeGenre === g.id
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}

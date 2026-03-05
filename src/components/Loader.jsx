export default function Loader({ rows = 3 }) {
  return (
    <div className="space-y-10">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r}>
          <div className="skeleton h-5 w-40 rounded mb-3 ml-4 md:ml-12" />
          <div className="flex gap-3 overflow-hidden px-4 md:px-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton aspect-video w-[260px] sm:w-[300px] md:w-[330px] lg:w-[360px] rounded-lg shrink-0"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

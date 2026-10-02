export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-well,#f7f7f7)]">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading dashboard…
        </div>
      </div>
    </div>
  );
}

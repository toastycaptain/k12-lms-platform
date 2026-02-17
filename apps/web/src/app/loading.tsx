export default function RootLoadingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div
        aria-label="Loading"
        className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
      />
      <p className="text-sm text-gray-600">Loading workspace...</p>
    </main>
  );
}

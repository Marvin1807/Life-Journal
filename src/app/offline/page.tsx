export const metadata = { title: "Offline · Life Journal" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
        style={{ background: "var(--surface-2)" }}
      >
        ◐
      </div>
      <h1 className="text-[20px] font-semibold">Keine Verbindung</h1>
      <p className="max-w-xs text-[14px]" style={{ color: "var(--ink-2)" }}>
        Life Journal speichert deine Daten in der Cloud. Sobald du wieder online bist, ist alles da.
      </p>
    </main>
  );
}

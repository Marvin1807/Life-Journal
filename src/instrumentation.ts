/**
 * Läuft einmal beim Start des Servers, bevor die erste Anfrage bearbeitet wird.
 *
 * Normalerweise legt schon der Build die Tabellen an. Das setzt aber voraus,
 * dass die Datenbank zum Build-Zeitpunkt konfiguriert war. Wird sie erst danach
 * verbunden — oder sind ihre Variablen als "sensitive" nur zur Laufzeit
 * verfügbar — springt dieser Haken ein.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureSchema } = await import("@/db/ensure-schema");
  await ensureSchema();
}

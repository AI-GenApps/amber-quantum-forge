import { notFound } from "next/navigation";
import { CopyChallengeCode } from "./copy-challenge-code";

interface Preview {
  readonly challenge_id: string;
  readonly creator_alias: string;
  readonly mode: string;
  readonly origin_mode: string;
  readonly config_revision: number;
  readonly checkpoint: {
    readonly board: number[];
    readonly score: number;
    readonly move_count: number;
    readonly max_legal_moves?: number;
  };
  readonly checkpoint_hash: string;
  readonly status: string;
  readonly created_at: string;
}

interface RecordValue {
  readonly [key: string]: unknown;
}

const boardCellIds = "abcdefghijklmnop".split("");

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Merge Relay challenge",
  description: "A read-only Merge Relay challenge preview.",
  robots: { index: false, follow: false },
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function parsePreview(value: unknown): Preview | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const data = value.data;
  const checkpoint = data.checkpoint;
  if (!isRecord(checkpoint) || !Array.isArray(checkpoint.board)) return null;
  if (
    !text(data.challenge_id) ||
    !text(data.creator_alias) ||
    !text(data.mode) ||
    !text(data.origin_mode) ||
    !integer(data.config_revision) ||
    checkpoint.board.length !== 16 ||
    !checkpoint.board.every(integer) ||
    !integer(checkpoint.score) ||
    !integer(checkpoint.move_count) ||
    !text(data.checkpoint_hash) ||
    !text(data.status) ||
    !text(data.created_at)
  )
    return null;
  return {
    challenge_id: data.challenge_id,
    creator_alias: data.creator_alias,
    mode: data.mode,
    origin_mode: data.origin_mode,
    config_revision: data.config_revision,
    checkpoint: {
      board: checkpoint.board,
      score: checkpoint.score,
      move_count: checkpoint.move_count,
      ...(integer(checkpoint.max_legal_moves)
        ? { max_legal_moves: checkpoint.max_legal_moves }
        : {}),
    },
    checkpoint_hash: data.checkpoint_hash,
    status: data.status,
    created_at: data.created_at,
  };
}

type MergeEnvironment = "debug" | "staging" | "production";

function environment(value: string | string[] | undefined): MergeEnvironment | null {
  const selected = Array.isArray(value) ? value[0] : value;
  if (selected === "debug" || selected === "staging" || selected === "production") return selected;
  return null;
}

function isLoopback(hostname: string): boolean {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";
}

function trustedOrigin(value: string, hostnameOnly: boolean): string | null {
  try {
    const url = new URL(hostnameOnly ? `https://${value}` : value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.pathname !== "/" ||
      url.search.length > 0 ||
      url.hash.length > 0 ||
      url.username.length > 0 ||
      url.password.length > 0
    )
      return null;
    if (hostnameOnly && url.protocol !== "https:") return null;
    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      !isLoopback(url.hostname)
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

function pageOrigin(): string | null {
  const configured = process.env.MERGE_RELAY_PUBLIC_ORIGIN;
  if (configured) return trustedOrigin(configured, false);
  const vercelUrl = process.env.VERCEL_URL;
  return vercelUrl ? trustedOrigin(vercelUrl, true) : null;
}

async function readPreview(
  origin: string,
  target: "debug" | "staging" | "production",
  id: string,
): Promise<Preview | "missing" | "unavailable"> {
  try {
    const response = await fetch(
      `${origin}/api/games/merge_relay/${target}/challenges/${id}/resolve`,
      { cache: "no-store" },
    );
    if (response.status === 404) return "missing";
    if (!response.ok) return "unavailable";
    return parsePreview(await response.json()) ?? "unavailable";
  } catch {
    return "unavailable";
  }
}

function tileClass(value: number): string {
  if (value === 0) return "bg-[#f2eadf] text-[#b9a894]";
  if (value <= 4) return "bg-[#f7d9a6] text-[#5b3527]";
  if (value <= 16) return "bg-[#eea66b] text-white";
  if (value <= 64) return "bg-[#d85d4a] text-white";
  return "bg-[#6f4a8e] text-white";
}

function readableMode(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function MergeRelayChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ environment?: string | string[] }>;
}) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) notFound();
  const query = await searchParams;
  const target = environment(
    query.environment ?? process.env.MERGE_RELAY_SHARE_ENVIRONMENT ?? "production",
  );
  if (!target) notFound();
  const origin = pageOrigin();
  const preview = origin ? await readPreview(origin, target, id) : "unavailable";
  const appLink = `mergerelay://challenge/${id}`;

  if (preview === "missing") notFound();

  if (preview === "unavailable") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f1e7] px-6 py-12 text-[#3d2c24]">
        <section className="w-full max-w-lg rounded-[2rem] border border-[#eadac6] bg-white p-8 text-center shadow-xl shadow-[#6f4a8e]/10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#a95f38]">Merge Relay</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Preview unavailable</h1>
          <p className="mt-3 text-[#705c50]">
            This read-only challenge preview could not reach the local relay service. The code is
            still ready to paste into the app.
          </p>
          <div className="mt-6 rounded-2xl bg-[#f8f1e7] px-4 py-3 font-mono text-sm">{id}</div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a
              href={appLink}
              className="rounded-full bg-[#6f4a8e] px-5 py-3 text-sm font-bold text-white hover:bg-[#57366f]"
            >
              Open in Merge Relay
            </a>
            <CopyChallengeCode code={id} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f1e7] px-5 py-8 text-[#3d2c24] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[#a95f38]">
              Merge Relay
            </p>
            <p className="mt-1 text-sm text-[#806b5d]">A challenge worth passing on</p>
          </div>
          <span className="rounded-full border border-[#d8cbb8] bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#806b5d]">
            Read-only preview
          </span>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#6f4a8e]">
              {readableMode(preview.origin_mode)} relay
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em] sm:text-6xl">
              Your move,
              <br /> {preview.creator_alias}.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#705c50]">
              The board is set. Open the app to play the next three legal moves, or copy the code if
              Merge Relay is not installed yet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={appLink}
                className="rounded-full bg-[#6f4a8e] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#6f4a8e]/20 hover:bg-[#57366f]"
              >
                Open in Merge Relay
              </a>
              <CopyChallengeCode code={preview.challenge_id} />
            </div>
            <p className="mt-4 text-sm text-[#806b5d]">
              No app? Install it first, then use the open link, or paste the challenge code into
              Relays.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#eadac6] bg-white p-5 shadow-xl shadow-[#6f4a8e]/10 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a95f38]">
                  Board preview
                </p>
                <p className="mt-1 text-sm text-[#806b5d]">Score {preview.checkpoint.score}</p>
              </div>
              <div className="rounded-full bg-[#f8f1e7] px-3 py-1 text-xs font-bold text-[#6f4a8e]">
                {preview.checkpoint.max_legal_moves ?? 3} moves
              </div>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-[#d8cbb8] p-2">
              {preview.checkpoint.board.map((value, index) => (
                <div
                  key={boardCellIds[index]}
                  className={`flex aspect-square items-center justify-center rounded-xl text-lg font-black sm:text-xl ${tileClass(value)}`}
                >
                  {value === 0 ? "·" : value}
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-[#806b5d]">
              <span>Move {preview.checkpoint.move_count}</span>
              <span>Config r{preview.config_revision}</span>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-[#d8cbb8] pt-5 text-xs text-[#806b5d]">
          Challenge {preview.challenge_id} · {preview.status} · Rules stay on the server.
        </footer>
      </div>
    </main>
  );
}

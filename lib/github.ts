// GitHub single-file import. Server-side fetch only — the client never
// touches tokens, and we enforce the same size cap as uploads.

export type ParsedGithub = {
  owner: string;
  repo: string;
  ref: string;
  path: string;
};

export function parseGithubUrl(url: string): ParsedGithub | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== "github.com") return null;
    // /owner/repo/blob/ref/path...  or /owner/repo/raw/ref/path...
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 4) return null;
    const [owner, repo, kind, ...rest] = parts;
    if (kind === "blob" || kind === "raw") {
      const [ref, ...pathParts] = rest;
      if (!ref || pathParts.length === 0) return null;
      return { owner, repo, ref, path: pathParts.join("/") };
    }
    return null;
  } catch {
    return null;
  }
}

export function toRawUrl(p: ParsedGithub): string {
  return `https://raw.githubusercontent.com/${p.owner}/${p.repo}/${p.ref}/${p.path}`;
}

export async function fetchGithubFile(
  rawUrl: string,
  maxChars: number
): Promise<{ filename: string; code: string }> {
  // Audit run-2: do not follow redirects server-side. A redirect would
  // defeat the fixed-host pin; ask for the canonical URL instead.
  const res = await fetch(rawUrl, {
    headers: { "User-Agent": "Learn-From-Code" },
    redirect: "manual",
  });
  if (res.status >= 300 && res.status < 400) {
    throw new Error("GitHub file redirected. Paste the canonical github.com file URL.");
  }
  if (!res.ok) throw new Error(`GitHub fetch failed (${res.status}). Check branch + path.`);
  const text = await res.text();
  if (!text.trim()) throw new Error("File is empty.");
  if (text.length > maxChars)
    throw new Error(`File too large (${text.length.toLocaleString()} chars). Pick a smaller file.`);
  if (text.includes("\u0000")) throw new Error("File does not appear to be text.");
  const filename = rawUrl.split("/").pop() ?? "github-file";
  return { filename, code: text };
}

export function normalizeMermaidCode(raw: string): string {
    return raw
        .replace(/\\n/g, "\n")
        .replace(/^```(?:mermaid)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
}

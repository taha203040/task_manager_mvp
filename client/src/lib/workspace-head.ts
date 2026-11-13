export function workspaceHead(title: string, description: string) {
  return { meta: [{ title: `${title} — Tasky` }, { name: "description", content: description }, { property: "og:title", content: `${title} — Tasky` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}
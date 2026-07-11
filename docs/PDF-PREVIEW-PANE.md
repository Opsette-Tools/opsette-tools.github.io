# Reusable PdfPreviewPane component.

I want a reusable React component that renders a live, in-app preview of a PDF inside the UI (in a modal, drawer, or panel), so the user can see the document before downloading it. The PDF is generated client-side with @react-pdf/renderer (or any source that can produce a Blob). This should be a generic, reusable component — not tied to any one document type.

The core pattern (this is the important part):

The component takes a blobFactory: () => Promise<Blob> and a deps array.
Whenever deps change, it debounces (~350ms), calls blobFactory(), and renders the resulting blob.
Rendering = URL.createObjectURL(blob) → show it in an <iframe src={objectUrl} />. Use the PDF viewer hints in the src to hide the toolbar/nav: `${url}#toolbar=0&navpanes=0&view=FitH`.
Object-URL lifecycle is critical: before setting a new URL, revoke the previous one (URL.revokeObjectURL). Revoke the last one on unmount too. Track the current URL in a ref so cleanup is reliable. Never leak object URLs.
Guard against races: if deps change again mid-generation, ignore the stale result (a cancelled flag captured in the effect closure).
States it must handle:

Loading — a centered spinner while the first blob generates (and a small corner spinner when re-rendering after a change, without blanking the existing preview).
Empty — when there's nothing to preview (e.g. blobFactory returns null, or a caller passes hasContent={false}), show a friendly empty state instead of a broken iframe.
Error — if blobFactory throws, fail gracefully (clear the preview, optionally an error slot), don't crash.
API (keep it minimal and generic):


interface PdfPreviewPaneProps {
  blobFactory: () => Promise<Blob>;
  deps: unknown[];              // regenerate when these change
  enabled?: boolean;           // don't generate when closed/hidden (default true)
  height?: number | string;    // preview height; sensible default
  debounceMs?: number;         // default 350
  emptyText?: React.ReactNode;
}
Requirements:

Reusable and document-agnostic — I should be able to drop it next to any download flow and just hand it that flow's existing blob generator.
No any; use exact types (unknown[] for deps is fine).
Match this repo's existing UI library and conventions (look at how other components are styled/imported before writing).
Make it mobile-responsive (the preview should scale down cleanly).
Pair it with Download / Export actions that call the same blobFactory, so what you preview is exactly what you download.
Then demonstrate it by wiring it into one real download flow that already exists in this repo (find a place where we generate/download a PDF), so I can see the preview working end to end.

Before building, check whether @react-pdf/renderer is already a dependency; if the repo's PDFs are generated a different way (server-rendered, a different lib), adapt the blobFactory contract to whatever produces the bytes — the preview mechanism (blob → object URL → iframe, debounced, with cleanup) stays the same regardless of how the blob is made.

One note for you, Ruthnie: the #toolbar=0&navpanes=0&view=FitH iframe hints are browser-PDF-viewer hints — they work in Chrome/Edge's built-in viewer, which is the common case, and degrade harmlessly elsewhere. If that repo needs to support browsers without a native PDF viewer, tell the agent to note that as a limitation (the fallback is a "download to view" link). 
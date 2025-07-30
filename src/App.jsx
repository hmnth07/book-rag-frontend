import { useState, useRef } from "react";
import { openStream } from "./api";

export default function App() {
	const [question, setQuestion] = useState("");
	const [answer, setAnswer] = useState("");
	const [chunks, setChunks] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const esRef = useRef(null);

	function onSubmit(e) {
		e.preventDefault();
		const q = question.trim();
		if (!q) return;

		// reset UI
		setLoading(true);
		setError("");
		setAnswer("");
		setChunks([]);

		// open stream
		esRef.current = openStream(q, {
			onMeta: (data) => {
				if (Array.isArray(data?.chunks)) setChunks(data.chunks);
			},
			onToken: (text) => {
				// append incremental deltas
				setAnswer((prev) => prev + text);
			},
			onDone: () => setLoading(false),
			onError: (e) => {
				setLoading(false);
				setError(e?.message || "Stream error");
			},
		});
	}

	function cancelStream() {
		esRef.current?.close();
		setLoading(false);
	}

	return (
		<div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
			<h1>Book Q&A — Meditations (Streaming)</h1>

			<form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
				<input
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
					placeholder="Ask a question about the book…"
					style={{ flex: 1, padding: "0.75rem" }}
				/>
				<button
					disabled={loading || !question.trim()}
					style={{ padding: "0.75rem 1rem" }}
				>
					{loading ? "Asking…" : "Ask"}
				</button>
				{loading && (
					<button
						type="button"
						onClick={cancelStream}
						style={{ padding: "0.75rem 1rem" }}
					>
						Stop
					</button>
				)}
			</form>

			{error && <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>}

			<div style={{ marginTop: 20, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
				<h3>Answer</h3>
				<div>{answer || (loading ? "…" : "")}</div>
			</div>

			{!!chunks.length && (
				<details style={{ marginTop: 24 }}>
					<summary style={{ cursor: "pointer", fontWeight: 600 }}>
						Sources ({chunks.length})
					</summary>
					<ol style={{ marginTop: 12, paddingLeft: 18 }}>
						{chunks.map((c) => (
							<li key={c.id} style={{ marginBottom: 16 }}>
								<code style={{ opacity: 0.7 }}>Chunk #{c.id}</code>
								<div
									style={{
										border: "1px solid #e5e7eb",
										padding: "12px",
										borderRadius: 8,
										marginTop: 6,
										whiteSpace: "pre-wrap",
									}}
								>
									{c.text.length > 800 ? c.text.slice(0, 800) + "…" : c.text}
								</div>
							</li>
						))}
					</ol>
				</details>
			)}
		</div>
	);
}

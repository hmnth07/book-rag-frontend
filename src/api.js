// src/api.js
// src/api.js
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function openStream(question, { onMeta, onToken, onDone, onError }) {
	const url = `${API_URL}/ask-stream?question=${encodeURIComponent(question)}`;
	const es = new EventSource(url, { withCredentials: false });

	es.addEventListener("meta", (e) => {
		try {
			const data = JSON.parse(e.data);
			onMeta?.(data);
		} catch (err) {
			console.error("meta parse error", err);
		}
	});

	es.addEventListener("token", (e) => {
		try {
			const data = JSON.parse(e.data);
			onToken?.(data.text || "");
		} catch (err) {
			console.error("token parse error", err);
		}
	});

	es.addEventListener("done", () => {
		onDone?.();
		es.close();
	});

	es.addEventListener("error", (e) => {
		try {
			const data = JSON.parse(e.data);
			onError?.(new Error(data.message || "Stream error"));
		} catch {
			onError?.(new Error("Stream error"));
		}
		es.close();
	});

	return es; // caller can es.close() if needed
}

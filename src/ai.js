import { InferenceClient } from "@huggingface/inference";

function sanitizeHint(raw, word) {
  if (!raw || typeof raw !== "string") return "";
  let text = raw.trim();
  text = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
  text = text.replace(/^"+|"+$/g, "");
  text = text.replace(/^`+|`+$/g, "");
  const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const leakRegex = new RegExp(escaped, "ig");
  text = text.replace(leakRegex, "");
  text = text.trim();
  if (text.length > 180) text = text.slice(0, 180).trim();
  return text;
}

function fallbackHint(word) {
  const n = word.length;
  const first = word[0]?.toUpperCase() ?? "?";
  return `Common English word of ${n} letters starting with ${first}; think everyday usage, not technical.`;
}

// Development fallback using direct HF API
async function getHintDirect(word) {
  const token = import.meta.env.VITE_HF_ACCESS_TOKEN;
  if (!token) {
    console.warn("No HF token available for direct hint generation");
    return fallbackHint(word);
  }

  try {
    const client = new InferenceClient(token);
    const response = await client.chatCompletion({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        { 
          role: "system", 
          content: "Generate exactly one short hint about a hidden English word. Output one sentence on a single line. Medium difficulty - not too easy, not too hard. Never include the secret word or close variations. 8-18 words, plain language." 
        },
        {
          role: "user",
          content: `Secret word: "${word}". Return one medium-difficulty hint as a single sentence. Do not reveal the word.`,
        },
      ],
      max_tokens: 64,
      temperature: 0.5,
      top_p: 0.9,
    });
    
    let hint = sanitizeHint(response?.choices?.[0]?.message?.content ?? "", word);
    if (!hint) hint = fallbackHint(word);
    return hint;
  } catch (err) {
    console.error("Direct HF hint failed:", err);
    return fallbackHint(word);
  }
}

export async function getHint(word) {
  // In development, try API first, then fall back to direct HF
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      if (res.ok) {
        const data = await res.json();
        let hint = sanitizeHint(data?.hint ?? "", word);
        if (hint) return hint;
      }
    } catch (err) {
      console.log("API hint failed, trying direct HF:", err.message);
    }
    
    // Fall back to direct HF in development
    return getHintDirect(word);
  }

  // In production, use API only
  try {
    const res = await fetch("/api/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Hint API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    let hint = sanitizeHint(data?.hint ?? "", word);
    if (!hint) hint = fallbackHint(word);
    return hint;
  } catch (err) {
    console.error("getHint failed:", err);
    return fallbackHint(word);
  }
}
// Vercel serverless function to generate a single-line, balanced-difficulty hint
// Uses Hugging Face Inference server-side with a secret token

import { InferenceClient } from "@huggingface/inference";

const HF_TOKEN = process.env.HF_ACCESS_TOKEN || process.env.VITE_HF_ACCESS_TOKEN;
const MODEL = process.env.HF_HINT_MODEL || "mistralai/Mixtral-8x7B-Instruct-v0.1";

const SYSTEM_PROMPT = `You generate exactly one short hint about a hidden English word.
Rules:
- Output exactly one sentence on a single line. No list, no quotes, no prelude.
- Difficulty: medium. Avoid being trivial, avoid being cryptic.
- NEVER include the secret word or close variations/synonyms.
- Prefer generic properties: category, function, context, associations.
- 8 to 18 words. Use plain language.
`;

function sanitizeHint(raw, word) {
  if (!raw || typeof raw !== "string") return "";
  let text = raw.trim();
  // Force single line
  text = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
  // Strip surrounding quotes or code fences
  text = text.replace(/^"+|"+$/g, "");
  text = text.replace(/^`+|`+$/g, "");
  // Remove direct leaks of the word (case-insensitive)
  const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const leakRegex = new RegExp(escaped, "ig");
  text = text.replace(leakRegex, "");
  // Trim and enforce a reasonable length
  text = text.trim();
  if (text.length > 180) text = text.slice(0, 180).trim();
  return text;
}

function fallbackHint(word) {
  const n = word.length;
  const first = word[0]?.toUpperCase() ?? "?";
  return `Common English word of ${n} letters starting with ${first}; think everyday usage, not technical.`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!HF_TOKEN) {
      return res.status(500).json({ error: "Missing HF_ACCESS_TOKEN" });
    }

    const { word } = req.body ?? {};
    if (!word || typeof word !== "string" || !/^[a-zA-Z]{3,20}$/.test(word)) {
      return res.status(400).json({ error: "Invalid 'word'" });
    }

    const client = new InferenceClient(HF_TOKEN);
    const response = await client.chatCompletion({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Secret word: "${word.toLowerCase()}". Return one medium-difficulty hint as a single sentence. Do not reveal or allude to the word directly.`,
        },
      ],
      max_tokens: 64,
      temperature: 0.5,
      top_p: 0.9,
    });

    let hint = sanitizeHint(response?.choices?.[0]?.message?.content ?? "", word);
    // Simple guardrails
    if (!hint || /\b(word|secret|the answer)\b/i.test(hint)) {
      hint = fallbackHint(word);
    }

    return res.status(200).json({ hint });
  } catch (err) {
    console.error("/api/hint error:", err);
    return res.status(500).json({ error: "Failed to generate hint" });
  }
}



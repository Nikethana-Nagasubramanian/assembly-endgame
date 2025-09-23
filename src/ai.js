import { InferenceClient } from "@huggingface/inference";

let token = import.meta.env.VITE_HF_ACCESS_TOKEN;

const client = new InferenceClient(token, {
  baseUrl: "https://api-inference.huggingface.co"
});

const SYSTEM_PROMPT = `
You are an assistant that will give hints based on the word you receive. 
Make sure the hint is not too easy nor too difficult to crack. Don't include the word in the hint.
`;

export async function getHint(word) {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content:
              `Secret word: "${word}". ` +
              `Return only a single-line hint (no quotes, no preamble). And NEVER include the word in the hint itself.`,
          },
        ],
        max_tokens: 64,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error("Full error object:", err);
    throw err;
  }
}

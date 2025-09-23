import { InferenceClient } from "@huggingface/inference";

let token = import.meta.env.VITE_HF_ACCESS_TOKEN;

const client = new InferenceClient(token);

const SYSTEM_PROMPT = `
You are an assistant that will give hints based on the word you receive. 
Make sure the hint is not too easy nor too difficult to crack. Don't include the word in the hint.
`;

export async function getHint(word) {
  try {
    const response = await client.chatCompletion({
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
      max_tokens: 64, // enough for a one-liner
      temperature: 0.7, // some creativity, not too wild
      top_p: 0.9,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error("Full error object:", err);
    throw err; // Re-throw so you can see it in the UI too
  }
}
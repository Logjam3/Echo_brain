// echoBrain.ts — Echo Bureau's semantic trend intelligence core

import { OpenAI } from "openai";
import { googleTrendsFetcher } from "./utils/googleTrendsFetcher";
import { getRedditMentions } from "./utils/redditMentions";
import { cosineSimilarity } from "./utils/embeddingUtils";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function echoBrain(insightInput: {
  description: string;
  goal: string;
  audience: string;
}) {
  const prompt = `
You are a semantic distillation engine for viral strategy. Your job is to extract core themes, triggers, cultural hooks, and emotional vectors from the following:

- Product Description: ${insightInput.description}
- Campaign Goal: ${insightInput.goal}
- Target Audience: ${insightInput.audience}

Return 5–7 highly distilled, label-style phrases or signals. Be culturally aware, emotionally attuned, and sharp.
`;

  const distilled = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });

  const phrases = distilled.choices[0].message.content
    ?.split("\n")
    .map(p => p.replace(/^\- /, "").trim())
    .filter(Boolean) || [];

  const embeddings = await Promise.all(
    phrases.map(async phrase => {
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: phrase,
      });
      return { phrase, vector: res.data[0].embedding };
    })
  );

  const externalTrends = await Promise.all(
    embeddings.map(async ({ phrase, vector }) => {
      const [gTrend, rMentions] = await Promise.all([
        googleTrendsFetcher(phrase),
        getRedditMentions(phrase),
      ]);

      return {
        phrase,
        gTrendScore: gTrend.score,
        rBuzz: rMentions.count,
        combinedScore: gTrend.score * 0.6 + rMentions.count * 0.4,
      };
    })
  );

  const ranked = externalTrends
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((item, i) => ({
      rank: i + 1,
      phrase: item.phrase,
      googleTrend: item.gTrendScore,
      redditBuzz: item.rBuzz,
      totalScore: item.combinedScore.toFixed(2),
    }));

  return ranked;
}

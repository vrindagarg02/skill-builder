export async function generateAIAnalysis(payload) {
  if (!process.env.AI_API_KEY) return null;
  const prompt = `You are a developer skill analyst. Use ONLY the structured evidence below. Do not claim certainty or expertise. Return JSON with keys summary, strengths, improvementAreas, skillGaps, recommendedSkills, recommendedProjects, roadmap. Each skill gap must say that no strong evidence was found rather than claiming the user does not know it.\n\nDATA:\n${JSON.stringify(payload).slice(0, 50000)}`;
  const response = await fetch(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization:`Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', temperature:0.2, response_format:{type:'json_object'}, messages:[{role:'system',content:'Return valid JSON only.'},{role:'user',content:prompt}] })
  });
  if (!response.ok) return null;
  const data = await response.json();
  try { return JSON.parse(data.choices?.[0]?.message?.content || '{}'); } catch { return null; }
}

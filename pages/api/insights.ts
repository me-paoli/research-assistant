import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function getAllRecommendations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('recommendations')
    .not('recommendations', 'is', null);
  if (error) throw error;
  // Flatten all recommendations arrays
  return (data || []).flatMap((row: { recommendations: string[] }) => Array.isArray(row.recommendations) ? row.recommendations : []);
}

async function getTopRecommendationsWithOpenAI(recommendations: string[]): Promise<string[]> {
  if (recommendations.length === 0) return [];
  
  // Fetch product context from Supabase
  let productDescription = 'No product description provided.';
  let productUrl = '';
  try {
    const { data: product, error } = await supabase
      .from('product_context')
      .select('*')
      .single();
    if (product && !error) {
      productDescription = product.description || productDescription;
      productUrl = product.url || '';
    }
  } catch (e) {
    // fallback to default
  }

  const prompt = `PRODUCT CONTEXT:\nDescription: ${productDescription}\nURL: ${productUrl}\n\nYou are an expert product manager and research analyst. Your task is to analyze user interview recommendations and identify the most impactful insights for product developers to increase the product-market fit (PMF) score.\n\nCONTEXT:\nYou have been provided with ${recommendations.length} individual recommendations extracted from user interviews. These represent user feedback, pain points, and suggestions for product improvement.\n\nANALYSIS TASK:\n1. Group similar recommendations by theme or topic\n2. For each group, synthesize the core insight into a single, actionable recommendation\n3. Prioritize recommendations based on:\n   - Frequency of mention\n   - Impact on user experience\n   - Feasibility of implementation\n   - Strategic importance\n\nREQUIRED OUTPUT FORMAT:\nReturn ONLY a JSON array containing 3 to 4 recommendations as strings:\n[\n  "First recommendation - most important/frequent theme",\n  "Second recommendation - second most important theme", \n  "Third recommendation - third most important theme",\n  "Fourth recommendation (optional) - fourth most important theme"\n]\n\nRECOMMENDATION GUIDELINES:\n- Each recommendation should be clear, specific, and actionable for product developers\n- Focus on actions that would increase the product-market fit (PMF) score\n- Avoid generic statements - be specific\n- Use active voice and present tense\n- Each recommendation must be no more than 300 characters\n- The total of all recommendations must not exceed 1200 characters\n- Prioritize recommendations that would have the highest user impact\n\nRECOMMENDATIONS TO ANALYZE:\n${recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\\n')}\n\nIMPORTANT: Return ONLY the JSON array, no additional text or explanations.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 500,
  });
  
  try {
    const content = completion.choices[0].message.content || '[]'
    // Clean the response to ensure it's valid JSON
    const cleanedContent = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '')
    const json = JSON.parse(cleanedContent);
    if (Array.isArray(json)) return json.slice(0, 4).map(String);
    return [];
  } catch (error) {
    console.error('Error parsing recommendations JSON:', error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const recommendations = await getAllRecommendations();
      const top4 = await getTopRecommendationsWithOpenAI(recommendations);
      // Store in insights table
      const { data, error } = await supabase
        .from('insights')
        .insert([{ recommendations: top4, updated_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      res.status(200).json({ insights: data });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  } else if (req.method === 'GET') {
    // Return the latest insights row
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ insights: data });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 
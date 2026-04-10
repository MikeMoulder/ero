import OpenAI from 'openai';
import { config } from '../config';
import { RegisteredAPI } from '../types';
import { events } from './events.service';
import { getCatalogEntry } from '../config/api-catalog';

const openai = new OpenAI({
  apiKey: config.openrouter.apiKey,
  baseURL: config.openrouter.baseUrl,
});

export interface StepDescriptor {
  description: string;
  requiresApi: boolean;
  apiEndpoint: string | null;
  queryParams: Record<string, string> | null;
  agentRole: 'data_retrieval' | 'summarization' | 'verification' | 'analysis';
  estimatedCost: number;
}

export async function decomposeTask(
  prompt: string,
  availableApis: RegisteredAPI[]
): Promise<StepDescriptor[]> {
  const apiList = availableApis.map(a => {
    const catalog = getCatalogEntry(a.slug);
    return {
      name: a.name,
      slug: a.slug,
      baseUrl: a.baseUrl,
      price: a.price,
      description: catalog?.description || 'No description available',
      examplePaths: catalog?.examplePaths || [],
    };
  });

  try {
    const response = await openai.chat.completions.create({
      model: config.openrouter.model,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a task decomposition agent for an X402 payment gateway. Given a user task and available paid APIs, break the task into 2-5 sequential steps.

CRITICAL RULES:
1. apiEndpoint MUST start with "/{slug}/" where {slug} is the EXACT slug field from the available API list below. The slug is a short identifier like "worldtime", "dexscreener", "open-meteo", etc. NEVER use a sub-path as the first segment.
2. After the slug comes the sub-path from the API's examplePaths. So if slug="worldtime" and examplePath="/timezone/America/New_York", the apiEndpoint is "/worldtime/timezone/America/New_York".
3. Query parameters go in the "queryParams" object, NOT in the apiEndpoint string
4. Use the examplePaths to understand what sub-paths each API supports — copy the pattern exactly
5. For weather tasks: first use slug "geocoding" to get coordinates, then slug "open-meteo" for weather data. Use {{step1.results[0].latitude}} and {{step1.results[0].longitude}} as query param values to reference data from step 1.
6. For time tasks: use slug "worldtime" with sub-path "/time/current/zone" and queryParams {"timeZone": "America/New_York"} (use proper IANA timezone names)
7. Each API call costs USDC — only call APIs when the step actually needs external data
8. Processing/summarization/analysis steps do NOT need API calls — set requiresApi to false
9. If no APIs match the task, create steps that don't require APIs
10. CROSS-STEP DATA: When a later step needs data from an earlier step's API response, use template syntax {{stepN.path}} in queryParams values. The path navigates the raw JSON response. Examples:
    - {{step1.results[0].latitude}} — first result's latitude from step 1
    - {{step1.rates.USD}} — USD rate from step 1
    - {{step2.data[0].id}} — first item's id from step 2
    NEVER use template syntax in apiEndpoint — only in queryParams values.

EXAMPLES OF CORRECT apiEndpoint FORMAT:
- "/worldtime/time/current/zone" with queryParams {"timeZone":"America/New_York"} (slug=worldtime)
- "/dexscreener/latest/dex/search" (slug=dexscreener)
- "/open-meteo/forecast" (slug=open-meteo)
- "/hackernews/topstories.json" (slug=hackernews)
- "/countries/name/united+states" (slug=countries)
- "/wikipedia/page/summary/Bitcoin" (slug=wikipedia)
- "/nasa/planetary/apod" (slug=nasa)

WRONG — NEVER do this:
- "/timezone/America/New_York" (missing slug!)
- "/simple/price" (missing slug!)
- "/forecast?latitude=40" (missing slug, query in path!)

OUTPUT FORMAT — respond with ONLY a JSON array, no markdown fences, no explanation:
[
  {
    "description": "Look up coordinates for the city",
    "requiresApi": true,
    "apiEndpoint": "/geocoding/search",
    "queryParams": { "name": "New York", "count": "1" },
    "agentRole": "data_retrieval",
    "estimatedCost": 0.01
  },
  {
    "description": "Fetch current weather using coordinates from step 1",
    "requiresApi": true,
    "apiEndpoint": "/open-meteo/forecast",
    "queryParams": { "latitude": "{{step1.results[0].latitude}}", "longitude": "{{step1.results[0].longitude}}", "current_weather": "true" },
    "agentRole": "data_retrieval",
    "estimatedCost": 0.01
  },
  {
    "description": "Summarize the weather data",
    "requiresApi": false,
    "apiEndpoint": null,
    "queryParams": null,
    "agentRole": "summarization",
    "estimatedCost": 0
  }
]

IMPORTANT: "estimatedCost" = the API's price if requiresApi is true, or 0 if no API call.

Agent roles: "data_retrieval" (fetch data), "summarization" (condense info), "verification" (cross-check), "analysis" (draw insights)

Available APIs:
${JSON.stringify(apiList, null, 2)}`,
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || '[]';
    const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const steps: StepDescriptor[] = JSON.parse(cleaned);

    // Post-process: normalize query params and default estimatedCost
    return steps.map(s => {
      const step = { ...s, estimatedCost: s.estimatedCost ?? 0, queryParams: s.queryParams || null };
      if (step.apiEndpoint && step.apiEndpoint.includes('?')) {
        const [path, qs] = step.apiEndpoint.split('?', 2);
        const parsed = Object.fromEntries(new URLSearchParams(qs));
        return {
          ...step,
          apiEndpoint: path,
          queryParams: { ...(step.queryParams || {}), ...parsed },
        };
      }
      return step;
    });
  } catch (err: any) {
    events.log('error', 'OpenAI', `Task decomposition failed: ${err.message}`);
    return [
      {
        description: `Process task: "${prompt}"`,
        requiresApi: false,
        apiEndpoint: null,
        queryParams: null,
        agentRole: 'analysis',
        estimatedCost: 0,
      },
    ];
  }
}

export async function executeAgentStep(
  role: string,
  description: string,
  inputData: any
): Promise<string> {
  const rolePrompts: Record<string, string> = {
    data_retrieval: 'You are a data retrieval agent. Process and organize the raw data provided. Extract key information and present it clearly.',
    summarization: 'You are a summarization agent. Create a concise, informative summary of the provided content. Highlight key points.',
    verification: 'You are a verification agent. Review the provided content for accuracy, completeness, and quality. Provide your assessment.',
    analysis: 'You are an analysis agent. Analyze the provided data and draw insights. Present findings clearly.',
  };

  try {
    const response = await openai.chat.completions.create({
      model: config.openrouter.model,
      temperature: 0.5,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: rolePrompts[role] || rolePrompts.analysis },
        {
          role: 'user',
          content: `Task: ${description}\n\nInput data:\n${typeof inputData === 'string' ? inputData : JSON.stringify(inputData, null, 2)}`,
        },
      ],
    });

    return response.choices[0]?.message?.content?.trim() || 'No output generated.';
  } catch (err: any) {
    events.log('error', 'OpenAI', `Agent step failed: ${err.message}`);
    return `Error processing step: ${err.message}`;
  }
}

/**
 * When template resolution fails (e.g. the API returned a bare array instead
 * of {results:[...]}), ask the LLM to rewrite the step's endpoint and
 * queryParams with concrete values from the actual previous step data.
 */
export async function patchStepWithData(
  step: { description: string; apiEndpoint: string; queryParams: Record<string, string> | null },
  previousStepsData: { index: number; data: any }[]
): Promise<{ apiEndpoint: string; queryParams: Record<string, string> }> {
  const stepDataSummary = previousStepsData.map(s => {
    let preview = JSON.stringify(s.data);
    // Truncate large arrays — show shape + first few items
    if (Array.isArray(s.data) && s.data.length > 10) {
      preview = JSON.stringify(s.data.slice(0, 10)) + ` ... (${s.data.length} items total)`;
    } else if (preview.length > 3000) {
      preview = preview.slice(0, 3000) + '...';
    }
    return `Step ${s.index + 1} raw API response:\n${preview}`;
  }).join('\n\n');

  const response = await openai.chat.completions.create({
    model: config.openrouter.model,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are fixing an API call that had unresolved template placeholders. Rewrite the endpoint and queryParams using CONCRETE values from the previous step data below.

Current step:
- description: ${step.description}
- apiEndpoint: ${step.apiEndpoint}
- queryParams: ${JSON.stringify(step.queryParams)}

${stepDataSummary}

Rules:
- apiEndpoint MUST start with /{slug}/ — keep the same slug
- Replace ALL {{...}} placeholders with actual values from the data above
- For arrays of IDs, use the first relevant item (or first 5 if the step says "top 5")
- Query params go in queryParams, NOT in the endpoint URL
- If the step needs multiple API calls (e.g. "fetch top 5 items"), pick the FIRST item only — other items will be handled separately

Respond with ONLY a JSON object, no markdown fences:
{"apiEndpoint": "/slug/path", "queryParams": {}}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim() || '{}';
  const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

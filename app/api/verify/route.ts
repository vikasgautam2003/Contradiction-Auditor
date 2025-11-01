// // import { NextResponse } from "next/server";

// // // --- CONFIGURATION ---
// // const API_KEY: string | undefined = process.env.GOOGLE_API_KEY;
// // const FAST_MODEL = "gemini-2.5-flash";
// // const RELIABLE_MODEL = "gemini-2.5-flash";

// // // --- TYPE DEFINITIONS ---
// // interface ContextChunk {
// //   id: number;
// //   docId: string;
// //   content: string;
// // }

// // interface Discrepancy {
// //   claim: string;
// //   sourceId: string;
// //   valueCited: string;
// // }

// // interface DiscrepancySchema {
// //   type: "ARRAY";
// //   description: string;
// //   items: {
// //     type: "OBJECT";
// //     properties: {
// //       claim: { type: "STRING" };
// //       sourceId: { type: "STRING"; enum: string[] };
// //       valueCited: { type: "STRING" };
// //     };
// //     required: string[];
// //   };
// // }

// // // --- SCHEMA ---
// // const DISCREPANCY_JSON_SCHEMA: DiscrepancySchema = {
// //   type: "ARRAY",
// //   description: "An array of conflicting or comparable claims found across multiple sources.",
// //   items: {
// //     type: "OBJECT",
// //     properties: {
// //       claim: { type: "STRING" },
// //       sourceId: {
// //         type: "STRING",
// //         enum: [
// //           "doc_A",
// //           "doc_B",
// //           "doc_C",
// //           "doc_D",
// //           "doc_E",
// //           "doc_F",
// //           "doc_G",
// //           "doc_H",
// //           "doc_I",
// //           "doc_J",
// //         ],
// //       },
// //       valueCited: { type: "STRING" },
// //     },
// //     required: ["claim", "sourceId", "valueCited"],
// //   },
// // };

// // // --- MOCK CONTEXT CHUNKS ---
// // const MOCK_CONTEXT_CHUNKS: ContextChunk[] = [
// //   { id: 1, docId: "doc_A", content: "Excerpt from Speech A: The Q4 job growth figure was 15,000 new jobs, as a direct result of our new economic policy." },
// //   { id: 2, docId: "doc_B", content: "Report B states a different outlook, projecting job growth for Q4 at 21,000 new jobs, based on internal forecasts." },
// //   { id: 3, docId: "doc_A", content: "The official report from Source A projects the 2025 Annual Revenue at $980 Million, a conservative estimate." },
// //   { id: 4, docId: "doc_C", content: "News Archive C cites the CEO, who claimed the Annual Revenue target for FY 2025 is $1.2 Billion." },
// //   { id: 5, docId: "doc_D", content: "A press release confirmed the acquisition completion date was May 15, 2024, marking the end of Q2." },
// //   { id: 6, docId: "doc_B", content: "A filing with the SEC noted the acquisition was finalized during Q2 2024, without specifying a day." },
// //   { id: 7, docId: "doc_E", content: "Unrelated text about market fluctuation trends that shows noise." },
// //   { id: 8, docId: "doc_A", content: "A separate section on operational efficiency and cost cutting measures for job reduction." },
// // ];

// // // --- UTILITY: EXPONENTIAL BACKOFF ---
// // async function fetchWithRetry(url: string, options: RequestInit, retries = 6, delay = 1000): Promise<Response> {
// //   for (let i = 0; i < retries; i++) {
// //     try {
// //       const response = await fetch(url, options);
// //       if (response.ok) return response;

// //       if (response.status === 429 && i < retries - 1) {
// //         await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
// //         continue;
// //       }

// //       return response;
// //     } catch (error) {
// //       if (i < retries - 1) {
// //         await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
// //         continue;
// //       }
// //       throw error;
// //     }
// //   }
// //   throw new Error("API request failed after all retries.");
// // }

// // // --- STAGE 1: QUERY TRANSFORMATION ---
// // async function generateSearchQueries(userQuery: string): Promise<string[]> {
// //   console.log("[STAGE 1] Starting Query Generation...");
// //   if (!API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

// //   const prompt = `
// //     You are a Query Optimizer. Given the user's core query: "${userQuery}",
// //     generate a list of exactly 3 highly optimized and distinct search queries 
// //     that cover all possible related concepts, synonyms, and specific data points 
// //     needed to find conflicting information. Return as a comma-separated list.
// //   `;

// //   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FAST_MODEL}:generateContent?key=${API_KEY}`;
// //   const payload = { contents: [{ parts: [{ text: prompt }] }] };

// //   const response = await fetchWithRetry(apiUrl, {
// //     method: "POST",
// //     headers: { "Content-Type": "application/json" },
// //     body: JSON.stringify(payload),
// //   });

// //   const result = await response.json();
// //   const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
// //   const queries = text.trim().split(/,\s*/).filter((q: string) => q.length > 0);

// //   console.log(`[STAGE 1] Queries Generated: ${queries.join(" | ")}`);
// //   return queries;
// // }

// // // --- STAGE 2 & 3: RETRIEVAL & RE-RANKING ---
// // function retrieveAndRankChunks(queries: string[]): ContextChunk[] {
// //   console.log(`[STAGE 2/3] Retrieving based on: ${queries[0]}`);

// //   const relevantKeywords = queries[0]?.toLowerCase().split(" ").slice(0, 3) || [];
// //   const candidateSet = MOCK_CONTEXT_CHUNKS.filter((chunk) =>
// //     relevantKeywords.some((keyword) => chunk.content.toLowerCase().includes(keyword))
// //   );

// //   const finalChunks = candidateSet
// //     .filter((chunk) => !chunk.content.includes("Unrelated text"))
// //     .slice(0, 6);

// //   console.log(`[STAGE 2/3] Selected ${finalChunks.length} chunks`);
// //   return finalChunks;
// // }

// // // --- STAGE 4: STRUCTURED VERIFICATION ---
// // async function performStructuredVerification(
// //   userQuery: string,
// //   contextChunks: ContextChunk[]
// // ): Promise<Discrepancy[]> {
// //   console.log("[STAGE 4] Structured Verification...");
// //   if (!API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

// //   const formattedContext = contextChunks
// //     .map((chunk) => `--- SOURCE ID: ${chunk.docId} ---\n${chunk.content}`)
// //     .join("\n\n");

// //   const systemInstruction = `
// //     You are an impartial, structured financial and research analyst. 
// //     Review the provided source documents (each prefixed with a 'SOURCE ID'). 
// //     For the user's query: "${userQuery}", extract all relevant facts 
// //     and group them into comparable claims.
// //     DO NOT synthesize or reconcile conflicting facts.
// //     Strictly adhere to the JSON schema provided.
// //   `;

// //   const finalPrompt = `
// //     CONTEXT CHUNKS:
// //     ${formattedContext}

// //     USER QUERY:
// //     "${userQuery}"

// //     Extract the structured array of facts based on the instructions.
// //   `;

// //   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${RELIABLE_MODEL}:generateContent?key=${API_KEY}`;
// //   const payload = {
// //     contents: [{ parts: [{ text: finalPrompt }] }],
// //     systemInstruction: { parts: [{ text: systemInstruction }] },
// //     generationConfig: {
// //       responseMimeType: "application/json",
// //       responseSchema: DISCREPANCY_JSON_SCHEMA as unknown,
// //     },
// //   };

// //   const response = await fetchWithRetry(apiUrl, {
// //     method: "POST",
// //     headers: { "Content-Type": "application/json" },
// //     body: JSON.stringify(payload),
// //   });

// //   const result = await response.json();
// //   const rawText: string | undefined = result.candidates?.[0]?.content?.parts?.[0]?.text;

// //   if (!rawText) throw new Error("Gemini structured output returned empty JSON.");
// //   const parsedData: Discrepancy[] = JSON.parse(rawText);

// //   console.log(`[STAGE 4] Parsed ${parsedData.length} discrepancies.`);
// //   return parsedData;
// // }

// // // --- NEXT.JS API HANDLER ---
// // export async function POST(request: Request): Promise<NextResponse> {
// //   console.log("--- FACT-CHECKER API: START ---");
// //   try {
// //     const { userQuery } = (await request.json()) as { userQuery?: string };
// //     if (!userQuery) {
// //       return NextResponse.json({ error: "Missing userQuery" }, { status: 400 });
// //     }

// //     const searchQueries = await generateSearchQueries(userQuery);
// //     const finalChunks = retrieveAndRankChunks(searchQueries);

// //     if (finalChunks.length === 0) {
// //       return NextResponse.json(
// //         { discrepancies: [], message: "No relevant documents found for verification." },
// //         { status: 200 }
// //       );
// //     }

// //     const discrepancies = await performStructuredVerification(userQuery, finalChunks);

// //     return NextResponse.json(
// //       {
// //         discrepancies,
// //         sourceQueries: searchQueries,
// //         contextChunkCount: finalChunks.length,
// //       },
// //       { status: 200 }
// //     );
// //   } catch (error) {
// //     console.error("FACT-CHECKER ERROR:", error);
// //     const errMsg = error instanceof Error ? error.message : "Unknown error";
// //     return NextResponse.json({ error: errMsg }, { status: 500 });
// //   }
// // }




// import { NextResponse } from "next/server";
// import { z } from "zod";

// const API_KEY: string | undefined = process.env.GOOGLE_API_KEY;
// const FAST_MODEL = "gemini-2.5-flash";
// const RELIABLE_MODEL = "gemini-2.5-flash";

// interface ContextChunk {
//   id: number;
//   docId: string;
//   content: string;
// }

// interface Discrepancy {
//   claim: string;
//   sourceId: string;
//   valueCited: string;
// }

// const DiscrepancySchema = z.object({
//   claim: z.string(),
//   sourceId: z.enum([
//     "doc_A",
//     "doc_B",
//     "doc_C",
//     "doc_D",
//     "doc_E",
//     "doc_F",
//     "doc_G",
//     "doc_H",
//     "doc_I",
//     "doc_J",
//   ]),
//   valueCited: z.string(),
// });

// export const DiscrepancyArraySchema = z.array(DiscrepancySchema);

// const DISCREPANCY_JSON_SCHEMA = {
//   type: "ARRAY",
//   description: "An array of conflicting or comparable claims found across multiple sources.",
//   items: {
//     type: "OBJECT",
//     properties: {
//       claim: { type: "STRING" },
//       sourceId: {
//         type: "STRING",
//         enum: [
//           "doc_A",
//           "doc_B",
//           "doc_C",
//           "doc_D",
//           "doc_E",
//           "doc_F",
//           "doc_G",
//           "doc_H",
//           "doc_I",
//           "doc_J",
//         ],
//       },
//       valueCited: { type: "STRING" },
//     },
//     required: ["claim", "sourceId", "valueCited"],
//   },
// };

// const MOCK_CONTEXT_CHUNKS: ContextChunk[] = [
//   {
//     id: 1,
//     docId: "doc_A",
//     content:
//       "Excerpt from Speech A: The Q4 job growth figure was 15,000 new jobs, as a direct result of our new economic policy.",
//   },
//   {
//     id: 2,
//     docId: "doc_B",
//     content:
//       "Report B states a different outlook, projecting job growth for Q4 at 21,000 new jobs, based on internal forecasts.",
//   },
//   {
//     id: 3,
//     docId: "doc_A",
//     content:
//       "The official report from Source A projects the 2025 Annual Revenue at $980 Million, a conservative estimate.",
//   },
//   {
//     id: 4,
//     docId: "doc_C",
//     content:
//       "News Archive C cites the CEO, who claimed the Annual Revenue target for FY 2025 is $1.2 Billion.",
//   },
//   {
//     id: 5,
//     docId: "doc_D",
//     content:
//       "A press release confirmed the acquisition completion date was May 15, 2024, marking the end of Q2.",
//   },
//   {
//     id: 6,
//     docId: "doc_B",
//     content:
//       "A filing with the SEC noted the acquisition was finalized during Q2 2024, without specifying a day.",
//   },
//   {
//     id: 7,
//     docId: "doc_E",
//     content: "Unrelated text about market fluctuation trends that shows noise.",
//   },
//   {
//     id: 8,
//     docId: "doc_A",
//     content:
//       "A separate section on operational efficiency and cost cutting measures for job reduction.",
//   },
// ];

// async function fetchWithRetry(url: string, options: RequestInit, retries = 6, delay = 1000): Promise<Response> {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const response = await fetch(url, options);
//       if (response.ok) return response;
//       if (response.status === 429 && i < retries - 1) {
//         await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
//         continue;
//       }
//       return response;
//     } catch (error) {
//       if (i < retries - 1) {
//         await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
//         continue;
//       }
//       throw error;
//     }
//   }
//   throw new Error("API request failed after all retries.");
// }

// async function generateSearchQueries(userQuery: string): Promise<string[]> {
//   console.log("[STAGE 1] Starting Query Generation...");
//   if (!API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

//   const prompt = `
//     You are a Query Optimizer. Given the user's core query: "${userQuery}",
//     generate a list of exactly 3 highly optimized and distinct search queries 
//     that cover all possible related concepts, synonyms, and specific data points 
//     needed to find conflicting information. Return as a comma-separated list.
//   `;

//   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FAST_MODEL}:generateContent?key=${API_KEY}`;
//   const payload = { contents: [{ parts: [{ text: prompt }] }] };

//   const response = await fetchWithRetry(apiUrl, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   const result = await response.json();
//   const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//   const queries = text.trim().split(/,\s*/).filter((q: string) => q.length > 0);

//   if (queries.length === 0) {
//     console.warn("[STAGE 1] Queries Generated: FAILED. Using original query as fallback.");
//     return [userQuery];
//   }

//   console.log(`[STAGE 1] Queries Generated: ${queries.join(" | ")}`);
//   return queries;
// }

// function retrieveAndRankChunks(queries: string[]): ContextChunk[] {
//   console.log(`[STAGE 2/3] Retrieving based on: ${queries[0]}`);
//   const relevantKeywords = queries[0].toLowerCase().split(" ").slice(0, 3);
//   const candidateSet = MOCK_CONTEXT_CHUNKS.filter((chunk) =>
//     relevantKeywords.some((keyword) => chunk.content.toLowerCase().includes(keyword))
//   );
//   const finalChunks = candidateSet.filter((chunk) => !chunk.content.includes("Unrelated text")).slice(0, 6);
//   console.log(`[STAGE 2/3] Selected ${finalChunks.length} chunks`);
//   return finalChunks;
// }

// async function performStructuredVerification(userQuery: string, contextChunks: ContextChunk[]): Promise<Discrepancy[]> {
//   console.log("[STAGE 4] Structured Verification...");
//   if (!API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

//   const formattedContext = contextChunks
//     .map((chunk) => `--- SOURCE ID: ${chunk.docId} ---\n${chunk.content}`)
//     .join("\n\n");

//   const systemInstruction = `
//     You are an impartial, structured financial and research analyst. 
//     Review the provided source documents (each prefixed with a 'SOURCE ID'). 
//     For the user's query: "${userQuery}", extract all relevant facts 
//     and group them into comparable claims.
//     DO NOT synthesize or reconcile conflicting facts.
//     Strictly adhere to the JSON schema provided.
//   `;

//   const finalPrompt = `CONTEXT CHUNKS:\n${formattedContext}\n\nUSER QUERY: "${userQuery}"\n\nExtract the structured array of facts based on the instructions.`;

//   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${RELIABLE_MODEL}:generateContent?key=${API_KEY}`;
//   const payload = {
//     contents: [{ parts: [{ text: finalPrompt }] }],
//     systemInstruction: { parts: [{ text: systemInstruction }] },
//     generationConfig: {
//       responseMimeType: "application/json",
//       responseSchema: DISCREPANCY_JSON_SCHEMA as unknown,
//     },
//   };

//   const response = await fetchWithRetry(apiUrl, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   const result = await response.json();
//   const rawText: string | undefined = result.candidates?.[0]?.content?.parts?.[0]?.text;
//   if (!rawText) throw new Error("Gemini structured output failed to return text.");

//   const strippedText = rawText.replace(/^```json\s*|```\s*$/g, "");
//   let parsedData: unknown;

//   try {
//     parsedData = JSON.parse(strippedText);
//   } catch (e: any) {
//     throw new Error(`Failed to parse JSON from Gemini output: ${e.message}`);
//   }

//   try {
//     const validatedData = DiscrepancyArraySchema.parse(parsedData);
//     console.log(`[STAGE 4] Parsed ${validatedData.length} discrepancies.`);
//     return validatedData;
//   } catch (e) {
//     if (e instanceof z.ZodError) {
//       console.error("ZOD VALIDATION FAILED:", e.issues);
//       throw new Error("Validation Error: Gemini output did not match schema.");
//     }
//     throw e;
//   }
// }

// export async function POST(request: Request): Promise<NextResponse> {
//   console.log("--- FACT-CHECKER API: START ---");
//   try {
//     const { userQuery } = (await request.json()) as { userQuery?: string };
//     if (!userQuery) {
//       return NextResponse.json({ error: "Missing userQuery" }, { status: 400 });
//     }

//     const searchQueries = await generateSearchQueries(userQuery);
//     const finalChunks = retrieveAndRankChunks(searchQueries);

//     if (finalChunks.length === 0) {
//       return NextResponse.json(
//         { discrepancies: [], message: "No relevant documents found for verification." },
//         { status: 200 }
//       );
//     }

//     const discrepancies = await performStructuredVerification(userQuery, finalChunks);

//     console.log("--- FACT-CHECKER API: SUCCESS ---");
//     return NextResponse.json(
//       { discrepancies, sourceQueries: searchQueries, contextChunkCount: finalChunks.length },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("FACT-CHECKER ERROR:", error);
//     const errMsg = error instanceof Error ? error.message : "Unknown error";
//     return NextResponse.json({ error: errMsg }, { status: 500 });
//   }
// }


























// import { NextResponse } from "next/server";
// import { z } from "zod";

// const API_KEY: string | undefined = process.env.GOOGLE_API_KEY;
// const FAST_MODEL = "gemini-2.5-flash";
// const RELIABLE_MODEL = "gemini-2.5-pro";

// interface ContextChunk {
//   id: number;
//   docId: string;
//   content: string;
// }

// interface Discrepancy {
//   claim: string;
//   sourceId: string;
//   valueCited: string;
// }

// const DiscrepancySchema = z.object({
//   claim: z.string(),
//   sourceId: z.enum([
//     "doc_A",
//     "doc_B",
//     "doc_C",
//     "doc_D",
//     "doc_E",
//     "doc_F",
//     "doc_G",
//     "doc_H",
//     "doc_I",
//     "doc_J",
//   ]),
//   valueCited: z.string(),
// });

// export const DiscrepancyArraySchema = z.array(DiscrepancySchema);

// const DISCREPANCY_JSON_SCHEMA = {
//   type: "ARRAY",
//   description: "An array of conflicting or comparable claims found across multiple sources.",
//   items: {
//     type: "OBJECT",
//     properties: {
//       claim: { type: "STRING" },
//       sourceId: {
//         type: "STRING",
//         enum: [
//           "doc_A",
//           "doc_B",
//           "doc_C",
//           "doc_D",
//           "doc_E",
//           "doc_F",
//           "doc_G",
//           "doc_H",
//           "doc_I",
//           "doc_J",
//         ],
//       },
//       valueCited: { type: "STRING" },
//     },
//     required: ["claim", "sourceId", "valueCited"],
//   },
// };

// const MOCK_CONTEXT_CHUNKS: ContextChunk[] = [
//   {
//     id: 1,
//     docId: "doc_A",
//     content:
//       "Excerpt from Speech A: The Q4 job growth figure was 15,000 new jobs, as a direct result of our new economic policy.",
//   },
//   {
//     id: 2,
//     docId: "doc_B",
//     content:
//       "Report B states a different outlook, projecting job growth for Q4 at 21,000 new jobs, based on internal forecasts.",
//   },
//   {
//     id: 3,
//     docId: "doc_A",
//     content:
//       "The official report from Source A projects the 2025 Annual Revenue at $980 Million, a conservative estimate.",
//   },
//   {
//     id: 4,
//     docId: "doc_C",
//     content:
//       "News Archive C cites the CEO, who claimed the Annual Revenue target for FY 2025 is $1.2 Billion.",
//   },
//   {
//     id: 5,
//     docId: "doc_D",
//     content:
//       "A press release confirmed the acquisition completion date was May 15, 2024, marking the end of Q2.",
//   },
//   {
//     id: 6,
//     docId: "doc_B",
//     content:
//       "A filing with the SEC noted the acquisition was finalized during Q2 2024, without specifying a day.",
//   },
//   {
//     id: 7,
//     docId: "doc_E",
//     content: "Unrelated text about market fluctuation trends that shows noise.",
//   },
//   {
//     id: 8,
//     docId: "doc_A",
//     content:
//       "A separate section on operational efficiency and cost cutting measures for job reduction.",
//   },
// ];

// async function fetchWithRetry(url: string, options: RequestInit, retries = 6, delay = 1000): Promise<Response> {
//   for (let i = 0; i < retries; i++) {
//     try {
//       const response = await fetch(url, options);
//       if (response.ok) return response;
//       if (response.status === 429 && i < retries - 1) {
//         await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
//         continue;
//       }
//       return response;
//     } catch (error) {
//       if (i < retries - 1) {
//         await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
//         continue;
//       }
//       throw error;
//     }
//   }
//   throw new Error("API request failed after all retries.");
// }

// async function generateSearchQueries(userQuery: string): Promise<string[]> {
//   if (!API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

//   const prompt = `
//     You are a Query Optimizer. Given the user's core query: "${userQuery}",
//     generate a list of exactly 3 highly optimized and distinct search queries 
//     that cover all possible related concepts, synonyms, and specific data points 
//     needed to find conflicting information. Return as a comma-separated list.
//   `;

//   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FAST_MODEL}:generateContent?key=${API_KEY}`;
//   const payload = { contents: [{ parts: [{ text: prompt }] }] };

//   const response = await fetchWithRetry(apiUrl, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   const result = await response.json();
//   const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//   const queries = text.trim().split(/,\s*/).filter((q: string) => q.length > 0);

//   if (queries.length === 0) {
//     return [userQuery];
//   }

//   return queries;
// }

// function retrieveAndRankChunks(queries: string[]): ContextChunk[] {
//   const relevantKeywords = queries[0].toLowerCase().split(" ").slice(0, 3);
//   const candidateSet = MOCK_CONTEXT_CHUNKS.filter((chunk) =>
//     relevantKeywords.some((keyword) => chunk.content.toLowerCase().includes(keyword))
//   );
//   const finalChunks = candidateSet.filter((chunk) => !chunk.content.includes("Unrelated text")).slice(0, 6);
//   return finalChunks;
// }

// function extractRawTextFromGeminiResult(result: any): string | undefined {
//   // Try likely fields in order of common Gemini responses
//   try {
//     // Some responses put content at result.candidates[0].content.parts[0].text
//     const c0 = result?.candidates?.[0];
//     if (!c0) return undefined;

//     const content = c0.content ?? c0.output ?? undefined;

//     // If content is an array with objects
//     if (Array.isArray(content)) {
//       for (const item of content) {
//         const parts = item?.parts ?? (Array.isArray(item) ? item : undefined);
//         if (!parts) continue;
//         const part = parts[0];
//         if (!part) continue;
//         if (typeof part.text === "string" && part.text.trim().length > 0) return part.text;
//         if (typeof part.json === "string" && part.json.trim().length > 0) return part.json;
//         if (part.inlineData?.data) return part.inlineData.data;
//         if (part.functionResponse?.response?.json) return part.functionResponse.response.json;
//         if (part.functionCall?.arguments) return part.functionCall.arguments;
//       }
//       // fallback: attempt to stringify array content
//       try {
//         return JSON.stringify(content);
//       } catch {
//         // continue
//       }
//     }

//     // If content is an object with parts
//     if (typeof content === "object") {
//       const parts = (content as any).parts ?? (Array.isArray(content) ? content : undefined);
//       if (Array.isArray(parts) && parts[0]) {
//         const part = parts[0];
//         if (typeof part.text === "string" && part.text.trim().length > 0) return part.text;
//         if (typeof part.json === "string" && part.json.trim().length > 0) return part.json;
//         if (part.inlineData?.data) return part.inlineData.data;
//         if (part.functionResponse?.response?.json) return part.functionResponse.response.json;
//         if (part.functionCall?.arguments) return part.functionCall.arguments;
//       }

//       // If content itself is a string
//       if (typeof content === "string" && content.trim().length > 0) return content;
//       // If content has structuredOutput with JSON-like data
//       if (content.structuredOutput?.data) {
//         try {
//           return JSON.stringify(content.structuredOutput.data);
//         } catch {
//           // continue
//         }
//       }
//     }

//     // Some endpoints return top-level output
//     if (typeof result.output === "string" && result.output.trim().length > 0) return result.output;

//     // Some responses might include a 'text' or 'message' at other paths
//     if (typeof result?.message?.content === "string") return result.message.content;
//     if (typeof result?.text === "string") return result.text;

//     // Last resort: stringify result
//     try {
//       return JSON.stringify(result);
//     } catch {
//       return undefined;
//     }
//   } catch {
//     return undefined;
//   }
// }

// async function performStructuredVerification(userQuery: string, contextChunks: ContextChunk[]): Promise<Discrepancy[]> {
//   if (!API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

//   const formattedContext = contextChunks.map((chunk) => `--- SOURCE ID: ${chunk.docId} ---\n${chunk.content}`).join("\n\n");

//   const systemInstruction = `
//     You are an impartial, structured financial and research analyst.
//     Review the provided source documents (each prefixed with a 'SOURCE ID').
//     For the user's query: "${userQuery}", extract all relevant facts and group them into comparable claims.
//     DO NOT synthesize or reconcile conflicting facts.
//     Strictly adhere to the JSON schema provided.
//   `;

//   const finalPrompt = `CONTEXT CHUNKS:\n${formattedContext}\n\nUSER QUERY: "${userQuery}"\n\nExtract the structured array of facts based on the instructions.`;

//   const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${RELIABLE_MODEL}:generateContent?key=${API_KEY}`;
//   const payload = {
//     contents: [{ parts: [{ text: finalPrompt }] }],
//     systemInstruction: { parts: [{ text: systemInstruction }] },
//     generationConfig: {
//       responseMimeType: "application/json",
//       responseSchema: DISCREPANCY_JSON_SCHEMA,
//     },
//   };

//   const response = await fetchWithRetry(apiUrl, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });

//   const result = await response.json();
//   const rawTextCandidate = extractRawTextFromGeminiResult(result);

//   if (!rawTextCandidate || typeof rawTextCandidate !== "string" || rawTextCandidate.trim().length === 0) {
//     console.error("Gemini structured output missing expected text field. Full response:", JSON.stringify(result, null, 2));
//     throw new Error("Gemini structured output failed to return text.");
//   }

//   // Remove common code fences and whitespace
//   const strippedText = rawTextCandidate.replace(/^```(?:json)?\s*|```\s*$/g, "").trim();

//   let parsedData: unknown;
//   try {
//     parsedData = JSON.parse(strippedText);
//   } catch (e: any) {
//     // If parsing fails, try to handle the case where the output is already an object stringified earlier
//     try {
//       // sometimes gemini returns a JSON object (not string) in other fields; attempt to use rawTextCandidate as-is
//       // but if it's not JSON parseable, surface the debug info
//       console.error("JSON parsing failed for strippedText. snippet:", strippedText.substring(0, 400));
//       throw new Error(`Failed to parse JSON from Gemini output: ${e?.message ?? e}`);
//     } catch (finalErr) {
//       throw finalErr;
//     }
//   }

//   try {
//     const validatedData = DiscrepancyArraySchema.parse(parsedData);
//     return validatedData;
//   } catch (e) {
//     if (e instanceof z.ZodError) {
//       console.error("ZOD VALIDATION FAILED:", e.issues);
//       // Provide the raw parsed object snippet in the error to help debugging
//       console.error("Parsed object snippet:", JSON.stringify(parsedData).substring(0, 1000));
//       throw new Error("Validation Error: Gemini output did not match schema.");
//     }
//     throw e;
//   }
// }

// export async function POST(request: Request): Promise<NextResponse> {
//   try {
//     const { userQuery } = (await request.json()) as { userQuery?: string };
//     if (!userQuery) {
//       return NextResponse.json({ error: "Missing userQuery" }, { status: 400 });
//     }

//     const searchQueries = await generateSearchQueries(userQuery);
//     const finalChunks = retrieveAndRankChunks(searchQueries);

//     if (finalChunks.length === 0) {
//       return NextResponse.json({ discrepancies: [], message: "No relevant documents found for verification." }, { status: 200 });
//     }

//     const discrepancies = await performStructuredVerification(userQuery, finalChunks);

//     return NextResponse.json(
//       { discrepancies, sourceQueries: searchQueries, contextChunkCount: finalChunks.length },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("FACT-CHECKER ERROR:", error);
//     const errMsg = error instanceof Error ? error.message : "Unknown error";
//     return NextResponse.json({ error: errMsg }, { status: 500 });
//   }
// }






import { NextResponse } from "next/server";
import { z } from "zod";

// --- CONFIGURATION ---
const GEMINI_API_KEY: string | undefined = process.env.GOOGLE_API_KEY; // Stage 1
const GROQ_API_KEY: string | undefined = process.env.LLAMA_API_KEY; // Stage 4
const FAST_MODEL = "gemini-2.5-flash"; // Stage 1 Model
const LLAMA_STRUCTURED_MODEL = "llama-3.1-8b-instant"; // Stage 4 Model (Reliable JSON)
const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// --- TYPE & ZOD DEFINITIONS ---
interface ContextChunk {
  id: number;
  docId: string;
  content: string;
}

interface Discrepancy {
  claim: string;
  sourceId: string;
  valueCited: string;
}

const DiscrepancySchema = z.object({
  claim: z.string(),
  sourceId: z.enum([
    "doc_A", "doc_B", "doc_C", "doc_D", "doc_E", "doc_F", "doc_G", "doc_H", "doc_I", "doc_J",
  ]),
  valueCited: z.string(),
});

export const DiscrepancyArraySchema = z.array(DiscrepancySchema);


const DISCREPANCY_JSON_SCHEMA_STRING = JSON.stringify({
  type: "array",
  items: {
    type: "object",
    properties: {
      claim: { type: "string" },
      sourceId: {
        type: "string",
        enum: ["doc_A", "doc_B", "doc_C", "doc_D", "doc_E", "doc_F", "doc_G", "doc_H", "doc_I", "doc_J"],
      },
      valueCited: { type: "string" },
    },
    required: ["claim", "sourceId", "valueCited"],
  },
}, null, 2);

// --- MOCK CONTEXT CHUNKS ---
const MOCK_CONTEXT_CHUNKS: ContextChunk[] = [
  { id: 1, docId: "doc_A", content: "Excerpt from Speech A: The Q4 job growth figure was 15,000 new jobs." },
  { id: 2, docId: "doc_B", content: "Report B projects job growth for Q4 at 21,000 new jobs." },
  { id: 3, docId: "doc_A", content: "Report from Source A projects 2025 Annual Revenue at $980 Million." },
  { id: 4, docId: "doc_C", content: "News Archive C cites the CEO claiming Annual Revenue target is $1.2 Billion." },
  { id: 5, docId: "doc_D", content: "Press release confirmed the acquisition date was May 15, 2024." },
  { id: 6, docId: "doc_B", content: "Filing with SEC noted acquisition was finalized during Q2 2024." },
  { id: 7, docId: "doc_E", content: "Unrelated text about market fluctuations." },
  { id: 8, docId: "doc_A", content: "Section on cost cutting measures for job reduction." },
];

// --- UTILITY: EXPONENTIAL BACKOFF ---
async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 1000): Promise<Response> {
  console.log(`[fetchWithRetry] Fetching: ${url}`);
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      console.log(`[fetchWithRetry] Attempt ${i + 1}: ${response.status}`);
      if (response.ok) return response;
      if (response.status === 429 && i < retries - 1) {
        const wait = delay * Math.pow(2, i);
        console.warn(`[fetchWithRetry] 429 Rate limit. Retrying in ${wait / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, wait));
        continue;
      }
      return response;
    } catch (error) {
      console.error(`[fetchWithRetry] Attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        const wait = delay * Math.pow(2, i);
        console.warn(`[fetchWithRetry] Retrying in ${wait / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, wait));
      } else {
        throw error;
      }
    }
  }
  throw new Error("API request failed after all retries.");
}

// --- STAGE 1: QUERY TRANSFORMATION ---
async function generateSearchQueries(userQuery: string): Promise<string[]> {
  console.log("[STAGE 1] START: Query Generation via Gemini Flash");
  if (!GEMINI_API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

  const prompt = `
You are a Query Optimizer. Given the user's query: "${userQuery}",
generate exactly 3 distinct optimized search queries as a comma-separated list.
`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FAST_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  console.log("[STAGE 1] Sending request to Gemini...");
  const response = await fetchWithRetry(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log("[STAGE 1] Gemini raw response:", result);

  const text: string = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  console.log("[STAGE 1] Extracted raw text:", text);

  const queries = text.trim().split(/,\s*/).filter((q: string) => q.length > 0);
  if (queries.length === 0) {
    console.warn("[STAGE 1] Query generation failed, using fallback.");
    return [userQuery];
  }

  console.log("[STAGE 1] Queries Generated:", queries);
  return queries;
}

// --- STAGE 2 & 3: RETRIEVAL & RE-RANKING ---
function retrieveAndRankChunks(queries: string[]): ContextChunk[] {
  console.log("[STAGE 2/3] START: Retrieval & Ranking");
  console.log(`[STAGE 2/3] Received Queries: ${queries.join(" | ")}`);

  const relevantKeywords = queries[0].toLowerCase().split(" ").slice(0, 3);
  console.log("[STAGE 2/3] Extracted Keywords:", relevantKeywords);

  const candidateSet = MOCK_CONTEXT_CHUNKS.filter((chunk) =>
    relevantKeywords.some((keyword) => chunk.content.toLowerCase().includes(keyword))
  );

  console.log(`[STAGE 2/3] Candidate Chunks Found: ${candidateSet.length}`);

  const finalChunks = candidateSet
    .filter((chunk) => !chunk.content.includes("Unrelated text"))
    .slice(0, 6);

  console.log(`[STAGE 2/3] Final Selected Chunks: ${finalChunks.length}`);
  return finalChunks;
}






// --- STAGE 4: STRUCTURED VERIFICATION (LLaMA via Groq) ---
// async function performStructuredVerification(userQuery: string, contextChunks: ContextChunk[]): Promise<Discrepancy[]> {
//   console.log("[STAGE 4] START: Structured Verification via LLaMA 3");
//   if (!GROQ_API_KEY) throw new Error("Missing LLAMA_API_KEY (Groq) in environment.");

//   const formattedContext = contextChunks.map((chunk) => `--- SOURCE ID: ${chunk.docId} ---\n${chunk.content}`).join("\n\n");

//   const systemInstruction = `
// You are an impartial structured analyst. Review CONTEXT CHUNKS and extract all factual discrepancies 
// related to the USER QUERY. Respond only with a valid JSON array, no markdown or commentary.
// `;

//   const structuredUserPrompt = `
// CONTEXT CHUNKS:
// ${formattedContext}

// USER QUERY: "${userQuery}"

// Return JSON only in this schema:
// ${DISCREPANCY_JSON_SCHEMA_STRING}
// `;

//   console.log("[STAGE 4] Sending request to LLaMA (Groq)...");
//   const payload = {
//     model: LLAMA_STRUCTURED_MODEL,
//     response_format: { type: "json_object" },
//     messages: [
//       { role: "system", content: systemInstruction },
//       { role: "user", content: structuredUserPrompt },
//     ],
//     temperature: 0.0,
//   };

//   const response = await fetchWithRetry(GROQ_API_ENDPOINT, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${GROQ_API_KEY}`,
//     },
//     body: JSON.stringify(payload),
//   });

//   console.log("[STAGE 4] LLaMA API response received.");
//   const result = await response.json();
//   console.log("[STAGE 4] Raw LLaMA result:", result);

//   const rawText: string | undefined = result.choices?.[0]?.message?.content;
//   console.log("[STAGE 4] Extracted raw text:", rawText);

//   if (!rawText) {
//     console.error("[STAGE 4] No valid structured output from LLaMA:", result);
//     throw new Error("LLaMA structured output failed. Check key or model response.");
//   }

//   let parsedData: unknown;
//   try {
//     parsedData = JSON.parse(rawText);
//     console.log("[STAGE 4] Parsed JSON successfully.");
//   } catch (e: any) {
//     console.error("[STAGE 4] Failed to parse LLaMA output:", rawText.substring(0, 400));
//     throw new Error(`Failed to parse JSON from LLaMA output: ${e.message}`);
//   }

//   try {
//     const validatedData = DiscrepancyArraySchema.parse(parsedData);
//     console.log(`[STAGE 4] Validation succeeded. Found ${validatedData.length} discrepancies.`);
//     return validatedData;
//   } catch (e: any) {
//     if (e instanceof z.ZodError) {
//       console.error("[STAGE 4] Zod validation errors:", e.issues);
//       console.error("Raw parsed data snippet:", JSON.stringify(parsedData).substring(0, 500));
//       throw new Error("Validation Error: LLaMA output did not match schema.");
//     }
//     throw e;
//   }
// }




// --- STAGE 4: STRUCTURED VERIFICATION (LLAMA 3 / GROQ) ---
async function performStructuredVerification(
  userQuery: string,
  contextChunks: ContextChunk[]
): Promise<Discrepancy[]> {
  console.log("[STAGE 4] START: Structured Verification via LLaMA 3");
  if (!GROQ_API_KEY) throw new Error("Missing LLAMA_API_KEY (Groq) in environment.");
  console.log("[STAGE 4] API key and environment validated.");

  const formattedContext = contextChunks
    .map((chunk) => `--- SOURCE ID: ${chunk.docId} ---\n${chunk.content}`)
    .join("\n\n");
  console.log("[STAGE 4] Context formatted:", formattedContext.substring(0, 200), "...");

  const systemInstruction = `
    You are a JSON extraction engine. Extract factual data from the context.
    Output ONLY a raw JSON ARRAY of facts. Match the provided structure exactly. No commentary or markdown.
  `;
  console.log("[STAGE 4] System instruction prepared.");

  const structuredUserPrompt = `
    CONTEXT CHUNKS:
    ${formattedContext}

    USER QUERY: "${userQuery}"

    Extract facts into a JSON array. The structure is defined by this schema:
    ${DISCREPANCY_JSON_SCHEMA_STRING}
  `;
  console.log("[STAGE 4] User prompt prepared.");

  const payload = {
    model: LLAMA_STRUCTURED_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: structuredUserPrompt }
    ],
    temperature: 0.0,
  };
  console.log("[STAGE 4] Payload built:", JSON.stringify(payload).substring(0, 500), "...");

  console.log("[STAGE 4] Sending request to LLaMA (Groq)...");
  const response = await fetchWithRetry(GROQ_API_ENDPOINT, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  console.log("[STAGE 4] LLaMA API response received. Status:", response.status);

  const result = await response.json();
  console.log("[STAGE 4] Raw LLaMA result:", JSON.stringify(result, null, 2).substring(0, 1000), "...");

  const rawText: string | undefined = result.choices?.[0]?.message?.content;
  console.log("[STAGE 4] Extracted raw text:", rawText ? rawText.substring(0, 500) : "undefined");

  if (!rawText) {
    console.error("[STAGE 4] No valid structured output from LLaMA:", result);
    throw new Error("LLaMA structured output failed. Check key or model response.");
  }

  let parsedData: unknown;
  try {
    console.log("[STAGE 4] Attempting to parse JSON output...");
    parsedData = JSON.parse(rawText);

    if (Array.isArray(parsedData)) {
      console.log("[STAGE 4] Parsed output is a valid JSON array.");
    } else if (typeof parsedData === 'object' && parsedData !== null && 'items' in parsedData && Array.isArray((parsedData as any).items)) {
      console.warn("[STAGE 4] Detected nested array in 'items'. Extracting array.");
      parsedData = (parsedData as any).items;
    } else if (typeof parsedData === 'object' && parsedData !== null && 'discrepancies' in parsedData && Array.isArray((parsedData as any).discrepancies)) {
      console.warn("[STAGE 4] Detected 'discrepancies' field. Extracting array.");
      parsedData = (parsedData as any).discrepancies;
    } else {
      console.warn("[STAGE 4] Parsed JSON not an array. Will validate as-is.");
    }
  } catch (e: any) {
    console.error("[STAGE 4] Failed to parse JSON from LLaMA output. Raw snippet:", rawText.substring(0, 400));
    throw new Error(`Failed to parse JSON from LLaMA output: ${e.message}`);
  }

  try {
    console.log("[STAGE 4] Validating parsed data against schema...");
    const validatedData = DiscrepancyArraySchema.parse(parsedData);
    console.log(`[STAGE 4] SUCCESS: Parsed ${validatedData.length} discrepancies successfully.`);
    return validatedData;
  } catch (e) {
    if (e instanceof z.ZodError) {
      console.error("[STAGE 4] ZOD VALIDATION FAILED:", e.issues);
      throw new Error("Validation Error: LLaMA output did not match schema after extraction attempts.");
    }
    console.error("[STAGE 4] Unknown error during validation:", e);
    throw e;
  }
}







// --- NEXT.JS API HANDLER ---
export async function POST(request: Request): Promise<NextResponse> {
  console.log("========= FACT-CHECKER API START =========");
  try {
    const { userQuery } = (await request.json()) as { userQuery?: string };
    console.log("[ENTRY] Received Request Body:", userQuery);

    if (!userQuery) {
      console.error("[ENTRY] Missing userQuery in request.");
      return NextResponse.json({ error: "Missing userQuery" }, { status: 400 });
    }

    // Stage 1
    const searchQueries = await generateSearchQueries(userQuery);
    console.log("[MAIN] Stage 1 completed.");

    // Stage 2/3
    const finalChunks = retrieveAndRankChunks(searchQueries);
    console.log("[MAIN] Stage 2/3 completed.");

    if (finalChunks.length === 0) {
      console.log("[MAIN] No chunks matched. Returning early.");
      return NextResponse.json(
        { discrepancies: [], message: "No relevant documents found for verification." },
        { status: 200 }
      );
    }

    // Stage 4
    const discrepancies = await performStructuredVerification(userQuery, finalChunks);
    console.log("[MAIN] Stage 4 completed.");

    console.log("========= FACT-CHECKER API SUCCESS =========");
    return NextResponse.json(
      { discrepancies, sourceQueries: searchQueries, contextChunkCount: finalChunks.length },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("========= FACT-CHECKER API ERROR =========");
    console.error(error);
    const errMsg = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

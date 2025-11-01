const EMBEDDING_MODEL= 'gemini-embedding-001';
const PINECONE_API_KEY= process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = 'gcp-starter';
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;


interface ContextChunk {
    id: number;
    docId: string;
    content: string;
}


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


async function generateEmbeddings(text: string): Promise<number[]> {
   
    if(!GEMINI_API_KEY) throw new Error("Missing GOOGLE_API_KEY in environment.");

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;

    const payload = {
        model: EMBEDDING_MODEL,
        content: {parts: [{ text: text}]}
    };

    const response = await fetchWithRetry(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),

    });


    const result = await response.json();
    const embedding = result.embedding?.values;

    if(!embedding) throw new Error("Failed to generate embedding.");


    return embedding;

}



export async function ingestDocuments(chunks: ContextChunk[]): Promise<void> {
    console.log(`[INGESTION SERVICE] Starting vector creation for ${chunks.length} chunks...`);

    const upsertVectors = [];

    for (const chunk of chunks) {

        try {

             const embedding = await generateEmbeddings(chunk.content);

            const vector = {
                id: 'chunk-${chunk.id',
                values: embedding,
                metadata: {
                    docId: chunk.docId,
                    sourceText: chunk.content
                },
            };
            upsertVectors.push(vector);

        } catch (error) {
            console.error(`[INGESTION SERVICE] Error processing chunk ${chunk.id}:`, error);
        }      
    
    }


    console.log(`[INGESTION SERVICE] Generated ${upsertVectors.length} vectors.`);



    // console.log(`[INGESTION SERVICE] Upsert simulation complete for ${PINECONE_INDEX_NAME}.`);
}
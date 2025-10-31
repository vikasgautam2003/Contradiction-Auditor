// "use client"

// import React, { useState, useCallback } from 'react';

// type SourceId = 'doc_A' | 'doc_B' | 'doc_C' | 'doc_D' | 'doc_E' | 'doc_F' | 'doc_G' | 'doc_H' | 'doc_I' | 'doc_J';

// interface Discrepancy {
//   claim: string;
//   sourceId: SourceId;
//   valueCited: string;
// }

// const MOCK_CONTEXT_CHUNKS = [
//   { id: 1, docId: 'doc_A', content: "Excerpt from Speech A: The Q4 job growth figure was 15,000 new jobs, as a direct result of our new economic policy." },
//   { id: 2, docId: 'doc_B', content: "Report B states a different outlook, projecting job growth for Q4 at 21,000 new jobs, based on internal forecasts." },
//   { id: 3, docId: 'doc_A', content: "The official report from Source A projects the 2025 Annual Revenue at $980 Million, a conservative estimate." },
//   { id: 4, docId: 'doc_C', content: "News Archive C cites the CEO, who claimed the Annual Revenue target for FY 2025 is $1.2 Billion." },
//   { id: 5, docId: 'doc_D', content: "A press release confirmed the acquisition completion date was May 15, 2024, marking the end of Q2." },
//   { id: 6, docId: 'doc_B', content: "A filing with the SEC noted the acquisition was finalized during Q2 2024, without specifying a day." },
// ];

// const FactCheckerApp = () => {
//   const [query, setQuery] = useState("Compare the job growth numbers cited by Speech A vs. Report B and projected 2025 revenue.");
//   const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedRow, setSelectedRow] = useState<Discrepancy | null>(null);



//   const rawChunkTemplate = (d: Discrepancy) => {
//     const chunk = MOCK_CONTEXT_CHUNKS.find(
//       c => c.docId === d.sourceId && c.content.includes(d.valueCited.split(' ')[0])
//     );
    
//     return `
// --- RAW TEXT CHUNK from Metadata ID: ${d.sourceId} ---

// Claim: "${d.claim}"
// Value Extracted: ${d.valueCited}

// --- FULL CONTEXT ---
// ${chunk ? chunk.content : 'Source chunk not found. (Could indicate ingestion or retrieval failure.)'}
//   `;
//   };



//   const executeVerification = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     setDiscrepancies([]);
//     setSelectedRow(null);

//     try {
//       const response = await fetch('/api/verify', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userQuery: query }),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || `Server error: ${response.status}`);
//       }

//       setDiscrepancies(result.discrepancies || []);
//       if (result.discrepancies && result.discrepancies.length > 0) {
//         setSelectedRow(result.discrepancies[0]);
//       }

//     } catch (e) {
//       console.error("Client fetch error:", e);
//       setError(`Failed to run verification pipeline: ${(e as Error).message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [query]);

//   return (
//     <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-8 text-white">
//       <script src="https://cdn.tailwindcss.com"></script>
//       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
//       <style>{`body { font-family: 'Inter', sans-serif; }`}</style>
      
//       <div className="max-w-7xl mx-auto">
//         <header className="mb-8 text-center">
//           <h1 className="text-4xl font-extrabold text-indigo-400">
//             Auditable Fact-Checker UI 
//           </h1>
//           <p className="mt-2 text-lg text-gray-400">
//             Client-side component consuming the server-side 5-Stage RAG Pipeline.
//           </p>
//         </header>
        
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
//           <label htmlFor="query" className="block text-sm font-medium text-gray-300 mb-2">Verification Query</label>
//           <textarea
//             id="query"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             rows={2}
//             className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
//             disabled={loading}
//           />
//           <button
//             onClick={executeVerification}
//             disabled={loading}
//             className={`w-full py-3 px-4 rounded-lg font-bold transition duration-300 ${
//               loading ? 'bg-indigo-700 cursor-not-allowed opacity-75' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
//             }`}
//           >
//             {loading ? (
//               <svg className="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//               </svg>
//             ) : 'Execute Verification Engine'}
//           </button>
//           {error && <p className="mt-4 text-center text-red-400 font-medium">Error: {error}</p>}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2 bg-gray-800 shadow-2xl rounded-xl overflow-hidden ring-1 ring-gray-700">
//             <h2 className="text-2xl font-bold p-4 bg-indigo-900 text-white">Discrepancy Table (Stage 5)</h2>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-700">
//                 <thead className="bg-gray-700">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/2">Claim Group</th>
//                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/4">Value Cited</th>
//                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/4">Source ID</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-800">
//                   {discrepancies.length === 0 ? (
//                     <tr>
//                       <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
//                         {loading ? 'Running RAG pipeline...' : 'Click "Execute" to run the verification.'}
//                       </td>
//                     </tr>
//                   ) : discrepancies.map((d, index) => (
//                     <tr
//                       key={index}
//                       className={`cursor-pointer transition duration-200 ease-in-out ${
//                         selectedRow === d ? 'bg-indigo-800 ring-2 ring-indigo-400' : 'hover:bg-gray-700'
//                       }`}
//                       onClick={() => setSelectedRow(d)}
//                     >
//                       <td className="px-6 py-4 whitespace-normal text-sm font-medium text-white">{d.claim}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-base text-red-400 font-extrabold">{d.valueCited}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-400 shadow-sm">
//                           {d.sourceId}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <div className="lg:col-span-1">
//             <h2 className="text-2xl font-bold text-gray-200 mb-4 flex items-center">
//               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2 text-indigo-400">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75m9-6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v15.75a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25V6ZM15 6V4.5a2.25 2.25 0 0 0-2.25-2.25H8.25A2.25 2.25 0 0 0 6 4.5V6m4.5 6a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75Z" />
//               </svg>
//               Audit Pane: Raw Source Chunk
//             </h2>
//             <div className="bg-gray-700 text-green-300 font-mono p-6 rounded-xl shadow-inner max-h-[30rem] overflow-y-auto whitespace-pre-wrap text-sm ring-1 ring-gray-600">
//               {selectedRow ? rawChunkTemplate(selectedRow) : 'Select a row in the table to view the exact text (the raw chunk) the LLM used for extraction.'}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FactCheckerApp;






// // src/components/FactChecker.tsx

// "use client"

// import React, { useState, useCallback } from 'react';

// type SourceId = 'doc_A' | 'doc_B' | 'doc_C' | 'doc_D' | 'doc_E' | 'doc_F' | 'doc_G' | 'doc_H' | 'doc_I' | 'doc_J';

// interface Discrepancy {
//   claim: string;
//   sourceId: SourceId;
//   valueCited: string;
// }

// const MOCK_CONTEXT_CHUNKS = [
//   { id: 1, docId: 'doc_A', content: "Excerpt from Speech A: The Q4 job growth figure was 15,000 new jobs, as a direct result of our new economic policy." },
//   { id: 2, docId: 'doc_B', content: "Report B states a different outlook, projecting job growth for Q4 at 21,000 new jobs, based on internal forecasts." },
//   { id: 3, docId: 'doc_A', content: "The official report from Source A projects the 2025 Annual Revenue at $980 Million, a conservative estimate." },
//   { id: 4, docId: 'doc_C', content: "News Archive C cites the CEO, who claimed the Annual Revenue target for FY 2025 is $1.2 Billion." },
//   { id: 5, docId: 'doc_D', content: "A press release confirmed the acquisition completion date was May 15, 2024, marking the end of Q2." },
//   { id: 6, docId: 'doc_B', content: "A filing with the SEC noted the acquisition was finalized during Q2 2024, without specifying a day." },
// ];

// const FactCheckerApp = () => {
//   const [query, setQuery] = useState("Compare the job growth numbers cited by Speech A vs. Report B and projected 2025 revenue.");
//   const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedRow, setSelectedRow] = useState<Discrepancy | null>(null);

//   const rawChunkTemplate = (d: Discrepancy) => {
//     const chunk = MOCK_CONTEXT_CHUNKS.find(
//       c => c.docId === d.sourceId && c.content.includes(d.valueCited.split(' ')[0])
//     );
//     
//     return `
// --- RAW TEXT CHUNK from Metadata ID: ${d.sourceId} ---

// Claim: "${d.claim}"
// Value Extracted: ${d.valueCited}

// --- FULL CONTEXT ---
// ${chunk ? chunk.content : 'Source chunk not found. (Could indicate ingestion or retrieval failure.)'}
//   `;
//   };

//   const executeVerification = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     setDiscrepancies([]);
//     setSelectedRow(null);

//     try {
//       const response = await fetch('/api/verify', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ userQuery: query }),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || `Server error: ${response.status}`);
//       }

//       setDiscrepancies(result.discrepancies || []);
//       if (result.discrepancies && result.discrepancies.length > 0) {
//         setSelectedRow(result.discrepancies[0]);
//       }

//     } catch (e) {
//       console.error("Client fetch error:", e);
//       setError(`Failed to run verification pipeline: ${(e as Error).message}`);
//     } finally {
//       setLoading(false);
//     }
//   }, [query]);

//   return (
//     <div className="min-h-screen bg-gray-900 font-sans p-4 sm:p-8 text-white">
//       <script src="https://cdn.tailwindcss.com"></script>
//       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
//       <style>{`body { font-family: 'Inter', sans-serif; }`}</style>
//       
//       <div className="max-w-7xl mx-auto">
//         <header className="mb-8 text-center">
//           <h1 className="text-4xl font-extrabold text-indigo-400">
//             Auditable Fact-Checker UI 
//           </h1>
//           <p className="mt-2 text-lg text-gray-400">
//             Client-side component consuming the server-side 5-Stage RAG Pipeline.
//           </p>
//         </header>
//         
//         <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
//           <label htmlFor="query" className="block text-sm font-medium text-gray-300 mb-2">Verification Query</label>
//           <textarea
//             id="query"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             rows={2}
//             className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
//             disabled={loading}
//           />
//           <button
//             onClick={executeVerification}
//             disabled={loading}
//             className={`w-full py-3 px-4 rounded-lg font-bold transition duration-300 ${
//               loading ? 'bg-indigo-700 cursor-not-allowed opacity-75' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
//             }`}
//           >
//             {loading ? (
//               <svg className="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//               </svg>
//             ) : 'Execute Verification Engine'}
//           </button>
//           {error && <p className="mt-4 text-center text-red-400 font-medium">Error: {error}</p>}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2 bg-gray-800 shadow-2xl rounded-xl overflow-hidden ring-1 ring-gray-700">
//             <h2 className="text-2xl font-bold p-4 bg-indigo-900 text-white">Discrepancy Table (Stage 5)</h2>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-700">
//                 <thead className="bg-gray-700">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/2">Claim Group</th>
//                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/4">Value Cited</th>
//                     <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/4">Source ID</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-800">
//                   {discrepancies.length === 0 ? (
//                     <tr>
//                       <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
//                         {loading ? 'Running RAG pipeline...' : 'Click "Execute" to run the verification.'}
//                       </td>
//                     </tr>
//                   ) : discrepancies.map((d, index) => (
//                     <tr
//                       key={index}
//                       className={`cursor-pointer transition duration-200 ease-in-out ${
//                         selectedRow === d ? 'bg-indigo-800 ring-2 ring-indigo-400' : 'hover:bg-gray-700'
//                       }`}
//                       onClick={() => setSelectedRow(d)}
//                     >
//                       <td className="px-6 py-4 whitespace-normal text-sm font-medium text-white">{d.claim}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-base text-red-400 font-extrabold">{d.valueCited}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-400 shadow-sm">
//                           {d.sourceId}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <div className="lg:col-span-1">
//             <h2 className="text-2xl font-bold text-gray-200 mb-4 flex items-center">
//               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2 text-indigo-400">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75m9-6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v15.75a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25V6ZM15 6V4.5a2.25 2.25 0 0 0-2.25-2.25H8.25A2.25 2.25 0 0 0 6 4.5V6m4.5 6a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75Z" />
//               </svg>
//               Audit Pane: Raw Source Chunk
//             </h2>
//             <div className="bg-gray-700 text-green-300 font-mono p-6 rounded-xl shadow-inner max-h-[30rem] overflow-y-auto whitespace-pre-wrap text-sm ring-1 ring-gray-600">
//               {selectedRow ? rawChunkTemplate(selectedRow) : 'Select a row in the table to view the exact text (the raw chunk) the LLM used for extraction.'}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FactCheckerApp;






"use client";

import React, { useState, useCallback } from 'react';

type SourceId =
  | 'doc_A' | 'doc_B' | 'doc_C' | 'doc_D' | 'doc_E'
  | 'doc_F' | 'doc_G' | 'doc_H' | 'doc_I' | 'doc_J';

interface Discrepancy {
  claim: string;
  sourceId: SourceId;
  valueCited: string;
}

const MOCK_CONTEXT_CHUNKS = [
  { id: 1, docId: 'doc_A', content: "Excerpt from Speech A: The Q4 job growth figure was 15,000 new jobs, as a direct result of our new economic policy." },
  { id: 2, docId: 'doc_B', content: "Report B states a different outlook, projecting job growth for Q4 at 21,000 new jobs, based on internal forecasts." },
  { id: 3, docId: 'doc_A', content: "The official report from Source A projects the 2025 Annual Revenue at $980 Million, a conservative estimate." },
  { id: 4, docId: 'doc_C', content: "News Archive C cites the CEO, who claimed the Annual Revenue target for FY 2025 is $1.2 Billion." },
  { id: 5, docId: 'doc_D', content: "A press release confirmed the acquisition completion date was May 15, 2024, marking the end of Q2." },
  { id: 6, docId: 'doc_B', content: "A filing with the SEC noted the acquisition was finalized during Q2 2024, without specifying a day." },
];

const FactCheckerApp = () => {
  const [query, setQuery] = useState("Compare the job growth numbers cited by Speech A vs. Report B and projected 2025 revenue.");
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Discrepancy | null>(null);

  const rawChunkTemplate = (d: Discrepancy) => {
    const chunk = MOCK_CONTEXT_CHUNKS.find(
      c => c.docId === d.sourceId && c.content.includes(d.valueCited.split(' ')[0])
    );
    return `
--- RAW TEXT CHUNK from Metadata ID: ${d.sourceId} ---

Claim: "${d.claim}"
Value Extracted: ${d.valueCited}

--- FULL CONTEXT ---
${chunk ? chunk.content : 'Source chunk not found. (Could indicate ingestion or retrieval failure.)'}
    `;
  };

  const executeVerification = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDiscrepancies([]);
    setSelectedRow(null);
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: query }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server error: ${response.status}`);
      setDiscrepancies(result.discrepancies || []);
      if (result.discrepancies?.length > 0) setSelectedRow(result.discrepancies[0]);
    } catch (e) {
      console.error("Client fetch error:", e);
      setError(`Failed to run verification pipeline: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white font-sans p-6 sm:p-10">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`body { font-family: 'Inter', sans-serif; }`}</style>

      <div className="max-w-7xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-md">
           Contradiction Auditor
          </h1>
          <p className="text-gray-400 text-lg">A structured client for the 5-Stage Verification Pipeline</p>
        </header>

        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-indigo-600/30">
          <label htmlFor="query" className="block text-sm font-semibold text-gray-300 mb-2">Verification Query</label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            disabled={loading}
            className="w-full p-4 mb-5 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
          />
          <button
            onClick={executeVerification}
            disabled={loading}
            className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
              loading
                ? 'bg-indigo-800/70 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-700/40'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Verifying...</span>
              </span>
            ) : 'Execute Verification Engine'}
          </button>
          {error && <p className="mt-4 text-center text-red-400 font-medium">{error}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gray-800/70 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
            <h2 className="text-2xl font-bold px-6 py-4 bg-gradient-to-r from-indigo-800 to-indigo-900 text-white border-b border-gray-700">
              Discrepancy Table
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/2">Claim</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/4">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-300 uppercase tracking-wider w-1/4">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {discrepancies.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                        {loading ? 'Running verification pipeline...' : 'Enter a query and run verification.'}
                      </td>
                    </tr>
                  ) : discrepancies.map((d, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedRow(d)}
                      className={`cursor-pointer transition-all duration-300 ${
                        selectedRow === d
                          ? 'bg-linear-to-r from-indigo-800 to-purple-800 text-white shadow-md'
                          : 'hover:bg-gray-700/70'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-white">{d.claim}</td>
                      <td className="px-6 py-4 text-base text-rose-400 font-bold">{d.valueCited}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-900/80 text-green-300 ring-1 ring-green-500/40 shadow-sm">
                          {d.sourceId}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-1 bg-gray-800/70 backdrop-blur-lg border border-gray-700 rounded-2xl p-5 shadow-xl flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-300 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75m9-6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v15.75a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25V6ZM15 6V4.5a2.25 2.25 0 0 0-2.25-2.25H8.25A2.25 2.25 0 0 0 6 4.5V6m4.5 6a.75.75 0 0 1 .75-.75h2.25a.75.75 0 0 1 0 1.5h-2.25a.75.75 0 0 1-.75-.75Z" />
              </svg>
              <span>Audit Pane</span>
            </h2>
            <div className="bg-gray-900/80 text-green-300 font-mono p-5 rounded-xl shadow-inner max-h-[30rem] overflow-y-auto whitespace-pre-wrap text-sm ring-1 ring-gray-700">
              {selectedRow
                ? rawChunkTemplate(selectedRow)
                : 'Select a row in the table to view the corresponding source chunk.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactCheckerApp;

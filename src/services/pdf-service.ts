
'use server';

// This function now uses a dynamic import for pdf-parse to avoid ESM/CJS conflicts
// during the Next.js build process. This ensures it works correctly in a server environment.

export async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  try {
    // Dynamically import pdf-parse which is a CJS module
    const pdf = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const data = await pdf(Buffer.from(pdfBytes));
    return data.text || '';
  } catch (error) {
    console.error("Error during PDF text extraction:", error);
    throw new Error("Failed to parse PDF file. It might be corrupted or encrypted.");
  }
}

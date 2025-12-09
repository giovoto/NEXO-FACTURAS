
'use server';

import 'server-only';
import { unzip } from 'unzipit';
import { parseDianUBL, type ParsedInvoice } from './xml-service';

type ParsedZipItem =
  | { type: 'xml'; name: string; parsed: ParsedInvoice }
  | { type: 'pdf'; name: string; buffer: Uint8Array }
  | { type: 'other'; name: string };

export async function parseInvoiceZip(arrayBuffer: ArrayBuffer): Promise<ParsedZipItem[]> {
  try {
    // Attempt to detect if it's a Zip file or just an XML
    // ZIP magic bytes: PK.. (0x50 0x4B 0x03 0x04)
    const view = new Uint8Array(arrayBuffer.slice(0, 4));
    const isZip = view[0] === 0x50 && view[1] === 0x4B;

    if (!isZip) {
      // Assume it's a plain XML file
      const dec = new TextDecoder("utf-8");
      const xmlContent = dec.decode(arrayBuffer);

      // Basic check to see if it looks like XML
      if (!xmlContent.trim().startsWith('<')) {
        throw new Error("El archivo no parece ser ni un ZIP ni un XML válido.");
      }

      return [{
        type: 'xml',
        name: 'uploaded_file.xml',
        parsed: parseDianUBL(xmlContent)
      }];
    }

    const { entries } = await unzip(arrayBuffer);
    const parsingPromises: Promise<ParsedZipItem>[] = [];

    for (const name in entries) {
      const entry = entries[name];
      if (entry.isDirectory) continue;

      if (name.toLowerCase().endsWith('.xml')) {
        parsingPromises.push(
          entry.text().then(xml => ({
            type: 'xml',
            name,
            parsed: parseDianUBL(xml),
          }))
        );
      } else if (name.toLowerCase().endsWith('.pdf')) {
        parsingPromises.push(
          entry.arrayBuffer().then(buffer => ({
            type: 'pdf',
            name,
            buffer: new Uint8Array(buffer),
          }))
        );
      } else {
        parsingPromises.push(Promise.resolve({ type: 'other', name }));
      }
    }

    return Promise.all(parsingPromises);
  } catch (error) {
    console.error("Failed to parse file:", error);
    const msg = error instanceof Error ? error.message : "Error desconocido";
    throw new Error(`Error al procesar el archivo: ${msg}`);
  }
}

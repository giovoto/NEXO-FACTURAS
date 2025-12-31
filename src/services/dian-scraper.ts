import puppeteer from 'puppeteer';
import { ParsedInvoice } from './xml-service';
import { parseDianExcel } from './dian-excel-parser';
const AdmZip = require('adm-zip');
import * as fs from 'fs';
import * as path from 'path';

/**
 * Scrapes DIAN portal directly using Puppeteer automation
 * Authenticates with token, navigates to Documents, exports Excel, and downloads ZIP
 */
export async function scrapeDianDocuments(
    tokenUrl: string,
    startDate?: string,
    endDate?: string
): Promise<{ success: boolean; documents: ParsedInvoice[]; message?: string }> {

    let browser;

    try {
        console.log('🚀 --- STARTING DIAN AUTOMATION WITH PUPPETEER ---');
        console.log('Token URL:', tokenUrl);

        // Launch Puppeteer browser
        console.log('🌐 Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Set download path
        const downloadPath = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadPath)) {
            fs.mkdirSync(downloadPath, { recursive: true });
        }

        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath
        });

        // Navigate to DIAN with token
        console.log('🔐 Authenticating with DIAN token...');
        await page.goto(tokenUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        console.log('⏳ Waiting for page to load...');
        await page.waitForTimeout(5000);

        // Take screenshot for debugging
        const debugScreenshot = path.join(downloadPath, 'dian-step1-auth.png');
        await page.screenshot({ path: debugScreenshot });
        console.log('📸 Screenshot saved:', debugScreenshot);

        // Look for "Documentos" or export option
        console.log('🔍 Looking for Documentos/Export menu...');

        // Try to find and click "Documentos" link
        const documentosLink = await page.$('a:has-text("Documentos"), a:has-text("Documents")');
        if (documentosLink) {
            console.log('📄 Found Documentos link, clicking...');
            await documentosLink.click();
            await page.waitForTimeout(3000);
        }

        // Look for "Recibidos" or "Received" documents
        console.log('📥 Looking for Recibidos section...');
        const recibidosLink = await page.$('a:has-text("Recibidos"), button:has-text("Recibidos")');
        if (recibidosLink) {
            console.log('✅ Found Recibidos, clicking...');
            await recibidosLink.click();
            await page.waitForTimeout(3000);
        }

        // Look for Export/Exportar button
        console.log('📊 Looking for Export Excel button...');
        const exportButton = await page.$('button:has-text("Exportar"), button:has-text("Export"), a:has-text("Exportar Excel")');

        if (exportButton) {
            console.log('🖱️ Found Export button, clicking...');
            await exportButton.click();
            await page.waitForTimeout(2000);

            // Look for confirmation modal "SI" button
            console.log('✔️ Looking for confirmation button...');
            const confirmButton = await page.$('button:has-text("SI"), button:has-text("Sí"), button:has-text("Yes"), button:has-text("Confirmar")');

            if (confirmButton) {
                console.log('✅ Found confirmation button, clicking...');
                await confirmButton.click();

                // Wait for download to start
                console.log('⏬ Waiting for download to complete...');
                await page.waitForTimeout(10000);

                // Look for downloaded ZIP file
                const files = fs.readdirSync(downloadPath);
                const zipFile = files.find(f => f.endsWith('.zip'));

                if (zipFile) {
                    console.log('📦 Found downloaded ZIP:', zipFile);
                    const zipPath = path.join(downloadPath, zipFile);
                    const zipBuffer = fs.readFileSync(zipPath);

                    // Extract Excel from ZIP
                    const zip = new AdmZip(zipBuffer);
                    const entries = zip.getEntries();

                    let excelBuffer: Buffer | null = null;
                    for (const entry of entries) {
                        if (entry.entryName.endsWith('.xlsx')) {
                            console.log('📊 Found Excel in ZIP:', entry.entryName);
                            excelBuffer = entry.getData();
                            break;
                        }
                    }

                    await browser.close();

                    if (!excelBuffer) {
                        return {
                            success: false,
                            message: 'ZIP descargado pero no contiene archivo Excel',
                            documents: []
                        };
                    }

                    // Parse Excel
                    console.log('🔄 Parsing Excel...');
                    const documents = await parseDianExcel(excelBuffer);

                    console.log(`✅ Parsed ${documents.length} documents`);

                    // Clean up
                    fs.unlinkSync(zipPath);

                    return {
                        success: true,
                        message: `Se extrajeron ${documents.length} documentos de la DIAN`,
                        documents
                    };

                } else {
                    await browser.close();
                    return {
                        success: false,
                        message: 'No se descargó ningún archivo ZIP. Verifica que tengas documentos disponibles.',
                        documents: []
                    };
                }

            } else {
                console.warn('⚠️ No se encontró botón de confirmación');
            }
        } else {
            console.warn('⚠️ No se encontró botón de exportación');
        }

        await browser.close();

        return {
            success: false,
            message: 'No se pudo automatizar la descarga. La estructura de la página de la DIAN puede haber cambiado.',
            documents: []
        };

    } catch (error: any) {
        console.error('❌ Puppeteer Error:', error.message);
        console.error(error.stack);

        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                // ignore
            }
        }

        return {
            success: false,
            message: `Error en automatización: ${error.message}`,
            documents: []
        };
    }
}

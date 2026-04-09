import Tesseract from 'tesseract.js';

class OCRProcessor {
    /**
     * Process a CBE Receipt screenshot
     * @param {string} imagePath - Path to the image file
     * @returns {Promise<Object>} - Extracted data
     */
    static async processCBEReceipt(imagePath) {
        try {
            console.log(`🔍 Processing OCR for: ${imagePath}`);
            const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng', {
                logger: m => console.log(m.status, (m.progress * 100).toFixed(2) + '%')
            });

            console.log(`📄 OCR Confidence: ${confidence}%`);
            const parsedData = this.parseCBEText(text);
            parsedData.confidence = confidence;

            // Display extracted info nicely in the terminal
            console.log('\n' + '='.repeat(40));
            console.log('💎 EXTRACTED RECEIPT INFORMATION');
            console.log('='.repeat(40));
            console.table({
                'Confidence': `${confidence}%`,
                'Transaction ID': parsedData.transactionID || '❌ NOT FOUND',
                'Amount': parsedData.amount ? `ETB ${parsedData.amount}` : '❌ NOT FOUND',
                'Receiver': parsedData.receiverName || '❌ NOT FOUND',
                'Date': parsedData.date || '❌ NOT FOUND'
            });
            console.log('='.repeat(40) + '\n');

            return parsedData;
        } catch (error) {
            console.error('OCR Processing Error:', error);
            throw new Error('Failed to read receipt image');
        }
    }

    /**
     * Parse the raw text from CBE screenshot (Optimized for USSD and Mobile App)
     * @param {string} text 
     */
    static parseCBEText(text) {
        // Standardize the text: replace newlines with spaces, uppercase everything
        const rawText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        const cleanText = rawText.toUpperCase();

        const result = {
            transactionID: null,
            amount: null,
            senderName: null,
            receiverName: null,
            date: null
        };

        // 1. IMPROVED AMOUNT (Look for ETB followed by number, regardless of spaces)
        // Matches "ETB 400", "ETB400", "ETB : 400.00"
        const amountMatch = cleanText.match(/ETB[:\s]*([\d,.]+)/i) || cleanText.match(/AMOUNT[:\s]*([\d,.]+)/i);
        if (amountMatch) {
            result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        }

        // 2. IMPROVED DATE
        const dateMatch = cleanText.match(/(\d{1,2}-[A-Z]{3}-\d{4})/i) || cleanText.match(/ON\s+(\d{1,2}\s+[A-Z]{3}\s+\d{4})/i);
        if (dateMatch) result.date = dateMatch[1].replace(/\s+/g, '-');

        // 3. IMPROVED TRANSACTION ID (The most critical part)
        // Heuristic 1: Look for explicit labels
        const idMatch = cleanText.match(/(?:REF|TXN ID|TXN|REFERENCE)[:\s#]*([A-Z0-9\s-]{6,20})/i);
        if (idMatch) {
            // Clean the ID: take the first continuous alphanumeric block
            result.transactionID = idMatch[1].trim().split(' ')[0];
        }

        // Heuristic 2: If no label, look for things that LOOK like CBE IDs (e.g., FT25098X...)
        if (!result.transactionID) {
            const genericIDMatch = cleanText.match(/\b([A-Z0-9]{10,20})\b/i);
            if (genericIDMatch) result.transactionID = genericIDMatch[1];
        }

        // 4. IMPROVED RECEIVER NAME
        // Look for names following "TO" or "FOR"
        const receivePart = cleanText.match(/(?:TO|FOR)[:\s]+([A-Z\s]{5,40})/i);
        if (receivePart) {
            let potentialName = receivePart[1].trim();
            // Remove common trail words that OCR might capture
            potentialName = potentialName
                .split(/\b(ON|ETB|FROM|AMOUNT|REF|DATE)\b/)[0]
                .replace(/[^A-Z\s]/g, '')
                .trim();

            if (potentialName.length > 3) result.receiverName = potentialName;
        }

        // 5. SENDER NAME
        const sendPart = cleanText.match(/(?:DEBITED FROM|FROM)[:\s]+([A-Z\s]{5,40})/i);
        if (sendPart) {
            result.senderName = sendPart[1].trim().split(/\b(FOR|TO|ETB|ON)\b/)[0].trim();
        }

        return result;
    }
}

export default OCRProcessor;

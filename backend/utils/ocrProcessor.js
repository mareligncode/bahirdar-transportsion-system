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

            console.log('💎 EXTRACTED RECEIPT INFORMATION');
            console.log('='.repeat(40));
            console.table({
                'Confidence': `${confidence}%`,
                'Transaction ID': parsedData.transactionID || ' NOT FOUND',
                'Amount': parsedData.amount ? `ETB ${parsedData.amount}` : '❌ NOT FOUND',
                'Receiver': parsedData.receiverName || ' NOT FOUND',
                'Date': parsedData.date || ' NOT FOUND'
            });
            console.log('='.repeat(40) + '\n');

            return parsedData;
        } catch (error) {
            console.error('OCR Processing Error:', error);
            throw new Error('Failed to read receipt image');
        }
    }

    static parseCBEText(text) {
        const rawText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        const cleanText = rawText.toUpperCase();

        const result = {
            transactionID: null,
            amount: null,
            senderName: null,
            receiverName: null,
            date: null
        };

        const amountMatch = cleanText.match(/ETB[:\s]*([\d,.]+)/i) || cleanText.match(/AMOUNT[:\s]*([\d,.]+)/i);
        if (amountMatch) {
            result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        }

        const dateMatch = cleanText.match(/(\d{1,2}-[A-Z]{3}-\d{4})/i) || cleanText.match(/ON\s+(\d{1,2}\s+[A-Z]{3}\s+\d{4})/i);
        if (dateMatch) result.date = dateMatch[1].replace(/\s+/g, '-');

        const idMatch = cleanText.match(/(?:REF|TXN ID|TXN|REFERENCE)[:\s#]*([A-Z0-9\s-]{6,20})/i);
        if (idMatch) {
            // Clean the ID: take the first continuous alphanumeric block
            result.transactionID = idMatch[1].trim().split(' ')[0];
        }

        if (!result.transactionID) {
            const genericIDMatch = cleanText.match(/\b([A-Z0-9]{10,20})\b/i);
            if (genericIDMatch) result.transactionID = genericIDMatch[1];
        }

        const receivePart = cleanText.match(/(?:TO|FOR)[:\s]+([A-Z\s]{5,40})/i);
        if (receivePart) {
            let potentialName = receivePart[1].trim();
            // Remove common trail words that OCR might capture
            potentialName = potentialName
                .split(/\b(ON|ETB|FROM|AMOUNT|REF|DATE|ACC)\b/)[0]
                .replace(/[^A-Z\s]/g, '')
                .trim();

            if (potentialName.length > 3) result.receiverName = potentialName;
        }

        const accountMatch = cleanText.match(/(?:ACCOUNT|ACC|TO[:\s]+[A-Z\s]+)\b(1000\d{6,11})\b/i) ||
            cleanText.match(/\b(101\d{7,10})\b/i) ||
            cleanText.match(/\b(1000\d{6,11})\b/i);

        if (accountMatch) {
            result.accountNumber = accountMatch[1] || accountMatch[0];
        }

        // 5. SENDER NAME
        const sendPart = cleanText.match(/(?:DEBITED FROM|FROM)[:\s]+([A-Z\s]{5,40})/i);
        if (sendPart) {
            result.senderName = sendPart[1].trim().split(/\b(FOR|TO|ETB|ON|ACC)\b/)[0].trim();
        }

        return result;
    }
}

export default OCRProcessor;

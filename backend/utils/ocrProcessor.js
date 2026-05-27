import Tesseract from 'tesseract.js';

class OCRProcessor {
    /**
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

        // 1. Look for common transaction ID prefixes
        const idMatch = cleanText.match(/(?:REF|TXN ID|TXN|REFERENCE|JOURNAL|RECEIPT NO|TID|ID|TRANSACTION)[:\s.#-]*([A-Z0-9]{6,20})/i);
        if (idMatch) {
            result.transactionID = idMatch[1].trim();
        }

        // 2. Look for CBE 'FT' transaction IDs anywhere
        if (!result.transactionID) {
            const ftMatch = cleanText.match(/(FT[A-Z0-9]{8,15})/i);
            if (ftMatch) result.transactionID = ftMatch[1];
        }

        // 3. Look for Telebirr/other standard alphanumeric IDs
        if (!result.transactionID) {
            // Find any 8-20 char word with BOTH letters and numbers
            const words = cleanText.split(/[^A-Z0-9]+/);
            for (const word of words) {
                if (word.length >= 8 && word.length <= 20 && /[A-Z]/.test(word) && /[0-9]/.test(word)) {
                    result.transactionID = word;
                    break;
                }
            }
        }

        // 4. Last resort: Look for purely numeric IDs (like some bank references) between 8 and 15 digits
        if (!result.transactionID) {
            const numMatch = cleanText.match(/\b([0-9]{8,15})\b/);
            // We ensure it doesn't match a date or phone number, but basic check is length
            if (numMatch && !numMatch[1].startsWith('09')) {
                result.transactionID = numMatch[1];
            }
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

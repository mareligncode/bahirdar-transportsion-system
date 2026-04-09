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
        // Clean text: remove extra spaces and standardize line breaks
        const cleanText = text.replace(/\s+/g, ' ').trim();

        const result = {
            transactionID: null,
            amount: null,
            senderName: null,
            receiverName: null,
            date: null
        };

        // 1. Match Amount (Matches "ETB 400.00" or "Amount: 400")
        const amountMatch = cleanText.match(/ETB\s+([\d,.]+)/i) || cleanText.match(/Amount[:\s]+([\d,.]+)/i);
        if (amountMatch) {
            result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        }

        // 2. Match Sender (Matches "debited from YOHANES DEBEBE MULATU")
        const senderMatch = cleanText.match(/debited from\s+([A-Z\s]+?)\s+for/i) ||
            cleanText.match(/From[:\s]+([A-Z\s]+?)(?:\s+to|\s+for|\s+on)/i);
        if (senderMatch) result.senderName = senderMatch[1].trim();

        // 3. Match Receiver (Matches "for YARED SHIMELIS TESHOME")
        const receiverMatch = cleanText.match(/for\s+([A-Z\s]+?)(?:\s+on|-ETB|\d|$)/i) ||
            cleanText.match(/to\s+([A-Z\s]+?)(?:\s+on|-ETB|\d|$)/i);
        if (receiverMatch) result.receiverName = receiverMatch[1].trim();

        // 4. Match Date (Matches "16-Aug-2025")
        const dateMatch = cleanText.match(/on\s+(\d{1,2}-[A-Za-z]{3}-\d{4})/i);
        if (dateMatch) result.date = dateMatch[1];

        // 5. Match Transaction ID (Matches "Ref: XXXXX" or "Txn ID: XXXXX")
        const txMatch = cleanText.match(/Ref[:\s]+(\w+)/i) ||
            cleanText.match(/Transaction ID[:\s]+(\w+)/i) ||
            cleanText.match(/Ref\s+No\.?\s*[:\s]*(\w+)/i);
        if (txMatch) result.transactionID = txMatch[1];

        return result;
    }
}

export default OCRProcessor;

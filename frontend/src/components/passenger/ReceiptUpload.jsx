import React, { useState, useRef } from 'react';
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Scan,
    Banknote,
    Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ReceiptUpload = ({ onVerificationSuccess, bookingId, amount }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size exceeds 5MB limit');
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setResult(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select an image first');
            return;
        }

        setProcessing(true);
        setError(null);
        const formData = new FormData();
        formData.append('receipt', file);
        if (bookingId) formData.append('bookingId', bookingId);

        try {
            const response = await api.post('/api/payment/verify-receipt', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setResult(response.data.data);
                toast.success('Receipt verified successfully!');
                if (onVerificationSuccess) {
                    onVerificationSuccess(response.data.data);
                }
            }
        } catch (error) {
            console.error('OCR Verification Error:', error);
            const msg = error.response?.data?.message || 'Failed to process receipt. Please try clear image.';
            setError(msg);
            toast.error(msg);
        } finally {
            setProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Scan className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900">OCR Receipt Verification</h3>
                </div>
                {amount && (
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Required Amount</p>
                        <p className="text-lg font-black text-blue-600">ETB {amount.toLocaleString()}</p>
                    </div>
                )}
            </div>

            <div className="p-6">
                {!preview ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                    >
                        <div className="w-16 h-16 bg-gray-50 group-hover:bg-blue-100 text-gray-400 group-hover:text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                            <Upload className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Upload Bank Receipt</h4>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG or JPEG (Max 5MB)</p>
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-amber-600 font-medium bg-amber-50 py-2 px-4 rounded-full w-fit mx-auto">
                            <Info className="w-3 h-3" />
                            Ensure transaction ID and amount are clearly visible
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-[300px] flex items-center justify-center">
                            <img src={preview} alt="Receipt preview" className="max-h-full object-contain" />
                            <button
                                onClick={reset}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {result ? (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4 text-green-700">
                                    <CheckCircle className="w-6 h-6" />
                                    <h4 className="font-bold">Extraction Successful</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Transaction ID</p>
                                        <p className="font-mono text-sm break-all font-bold text-green-900">{result.transactionId}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Amount Detected</p>
                                        <p className="text-xl font-black text-green-900">ETB {result.amount?.toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-2 border-t border-green-100">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Sender Name</p>
                                        <p className="text-sm font-medium text-green-900">{result.senderName || 'Not detected'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-900">Verification Failed</h4>
                                    <p className="text-xs text-red-700 mt-1">{error}</p>
                                    <button onClick={reset} className="text-xs font-bold text-red-600 mt-3 underline uppercase">Try different photo</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleUpload}
                                disabled={processing}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing Receipt with AI...
                                    </>
                                ) : (
                                    <>
                                        <Scan className="w-5 h-5" />
                                        Verify & Process Payment
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <Banknote className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-700">Manual Transfer Guide</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Transfer to CBE: <span className="font-mono font-bold">1000123456789</span> (Bahir Dar Transport)</p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
};

export default ReceiptUpload;

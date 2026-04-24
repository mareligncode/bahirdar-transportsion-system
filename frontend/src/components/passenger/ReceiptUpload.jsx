import React, { useState, useRef, useEffect } from 'react';
import {
    Upload,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Scan,
    Banknote,
    Info,
    Copy,
    ExternalLink,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ReceiptUpload = ({ onVerificationSuccess, bookingId, amount }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [bankDetails, setBankDetails] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch dynamic bank instructions
    useEffect(() => {
        const fetchInstructions = async () => {
            if (!bookingId) return;
            try {
                setLoadingDetails(true);
                const response = await api.get(`/api/payment/${bookingId}/instructions`);
                if (response.data.success) {
                    setBankDetails(response.data.data);
                }
            } catch (err) {
                console.error('Failed to load bank details:', err);
                toast.error('Could not load owner bank details');
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchInstructions();
    }, [bookingId]);

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied!`, {
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            }
        });
    };

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
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden max-w-2xl mx-auto transition-all duration-300">
            {/* Header Section */}
            <div className="p-8 bg-gradient-to-br from-blue-50/50 to-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                        <Scan className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-xl text-gray-900 leading-tight">Secure Payment Verification</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-blue-600 font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            AI Powered OCR System
                        </div>
                    </div>
                </div>
                {amount && (
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Payable Total</p>
                        <div className="flex items-baseline gap-1 justify-end">
                            <span className="text-sm font-bold text-gray-900">ETB</span>
                            <span className="text-3xl font-black text-gray-900">{amount.toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-8">
                {/* Bank Details Card - The User Request */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-blue-500" />
                            Receiver Bank Details
                        </h4>
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-md border border-amber-100 uppercase">Action Required</span>
                    </div>

                    {loadingDetails ? (
                        <div className="animate-pulse bg-gray-50 rounded-2xl p-6 h-32 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
                        </div>
                    ) : bankDetails ? (
                        <div className="relative group overflow-hidden bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-6 text-white shadow-2xl relative">
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none"></div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Bank Name</p>
                                    <p className="text-lg font-bold text-white flex items-center gap-2">
                                        {bankDetails.bankName}
                                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                    <div className="group/item cursor-pointer" onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account Number')}>
                                        <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Account Number</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xl font-mono font-black text-white hover:text-blue-400 transition-colors uppercase tracking-wider">
                                                {bankDetails.accountNumber}
                                            </p>
                                            <Copy className="w-4 h-4 text-white/50 group-hover/item:text-blue-400 transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mb-1">Account Holder Name</p>
                                        <p className="text-lg font-extrabold text-blue-50">{bankDetails.accountName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[10px] text-white/40 italic">Please double-check account name before sending</p>
                                <button className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5">
                                    <ExternalLink className="w-3 h-3" />
                                    Open App
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                            <p className="text-sm font-bold text-red-900">Failed to load bank details</p>
                            <p className="text-xs text-red-600 mt-1">Please refresh the page or contact support.</p>
                        </div>
                    )}
                </div>

                {!preview ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group cursor-pointer border-3 border-dashed border-gray-100 rounded-3xl p-10 text-center hover:border-blue-300 hover:bg-blue-50/20 transition-all duration-300"
                    >
                        <div className="w-20 h-20 bg-gray-50 group-hover:bg-blue-100 text-gray-300 group-hover:text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 -rotate-3 group-hover:rotate-0">
                            <Upload className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-extrabold text-gray-900">Upload Transfer Screenshot</h4>
                        <p className="text-sm text-gray-500 mt-2 font-medium">PNG, JPG or JPEG (Max 5MB)</p>

                        <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-indigo-700 font-black bg-indigo-50 py-3 px-6 rounded-2xl w-fit mx-auto border border-indigo-100">
                            <Info className="w-4 h-4" />
                            TXN ID & ACCOUNT MUST BE VISIBLE
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative group rounded-3xl overflow-hidden border-2 border-gray-100 bg-gray-50 max-h-[350px] flex items-center justify-center shadow-inner">
                            <img src={preview} alt="Receipt preview" className="max-h-full object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={reset}
                                    className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all transform hover:scale-110 shadow-xl"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {result ? (
                            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CheckCircle className="w-32 h-32 text-emerald-600" />
                                </div>

                                <div className="flex items-center gap-4 mb-8 text-emerald-800">
                                    <div className="p-2 bg-emerald-600 text-white rounded-xl">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-xl">Verification successful</h4>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Digital authenticity confirmed</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Transaction ID</p>
                                        <p className="font-mono text-base font-black text-emerald-950 break-all bg-emerald-600/5 p-2 rounded-lg">{result.transactionId}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Amount Matches</p>
                                        <p className="text-3xl font-black text-emerald-950 leading-none">ETB {result.amount?.toLocaleString()}</p>
                                    </div>
                                    {result.accountNumber && (
                                        <div className="col-span-2 space-y-1.5 pt-4 border-t border-emerald-200/50">
                                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Confirmed Recipient Account</p>
                                            <p className="text-lg font-black text-emerald-900 font-mono italic">{result.accountNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-6 flex gap-5">
                                <div className="p-3 bg-rose-600 text-white rounded-2xl shrink-0 h-fit">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl text-rose-900">Validation Failure</h4>
                                    <p className="text-sm font-semibold text-rose-700 mt-2 leading-relaxed">{error}</p>
                                    <button
                                        onClick={reset}
                                        className="mt-5 px-6 py-2.5 bg-rose-600 text-white text-xs font-black rounded-xl hover:bg-rose-700 transition-all uppercase tracking-widest shadow-lg shadow-rose-200"
                                    >
                                        Try Clear Photo
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleUpload}
                                disabled={processing}
                                className="w-full relative overflow-hidden group py-5 bg-gray-900 text-white rounded-2xl font-black text-lg transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                                            SECURELY ANALYZING DATA...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-6 h-6 text-blue-400" />
                                            VERIFY & RELEASE PAYMENT
                                        </>
                                    )}
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-200">
                        <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support Reference</p>
                        <p className="text-xs font-bold text-gray-800">CBE BIRR / MOBILE BANKING ACCEPTED</p>
                    </div>
                </div>
                <div className="text-[10px] text-gray-400 font-bold max-w-[200px] text-right leading-relaxed">
                    Automated verification uses neural networks to validate transaction integrity.
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


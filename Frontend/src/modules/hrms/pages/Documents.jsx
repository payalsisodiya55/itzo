import React, { useState, useEffect } from 'react';
import axiosInstance from '@core/api/axios';
import { FileText, Loader2, Download, ExternalLink } from 'lucide-react';

export default function Documents() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const url = filter ? `/hrms/documents/me?documentType=${filter}` : '/hrms/documents/me';
                const res = await axiosInstance.get(url);
                setDocuments(res.data?.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, [filter]);

    const typeColors = {
        'Offer Letter': 'bg-blue-50 text-blue-700',
        'Payslip': 'bg-emerald-50 text-emerald-700',
        'Aadhaar': 'bg-violet-50 text-violet-700',
        'PAN': 'bg-amber-50 text-amber-700',
        'Certificate': 'bg-cyan-50 text-cyan-700',
        'Resume': 'bg-pink-50 text-pink-700',
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>
                    <p className="text-sm text-slate-500 mt-1">View and download your official documents</p>
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                    className="h-10 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                    <option value="">All Types</option>
                    {['Offer Letter', 'Payslip', 'Aadhaar', 'PAN', 'Certificate', 'Resume', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                ) : documents.length === 0 ? (
                    <div className="text-center p-12">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No documents found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                        {documents.map(doc => (
                            <div key={doc._id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-orange-200 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeColors[doc.documentType] || 'bg-slate-100 text-slate-600'}`}>
                                        {doc.documentType}
                                    </div>
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                                <h3 className="font-semibold text-slate-900 text-sm mb-1 truncate">{doc.name}</h3>
                                <p className="text-xs text-slate-400">
                                    {doc.month && doc.year ? `${doc.month}/${doc.year} · ` : ''}
                                    {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

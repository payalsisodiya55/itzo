import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '@core/api/axios';
import { toast } from 'sonner';
import { FileText, Loader2, Upload, Trash2, Eye, Download, X, Search, Image as ImageIcon } from 'lucide-react';

export default function HrmsEmployeeDocs() {
    const [employees, setEmployees] = useState([]);
    const [documents, setDocuments] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    
    // Upload states
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 500, status: 'Active' });
            if (search) params.append('search', search);
            
            const [empRes, docRes] = await Promise.all([
                axiosInstance.get(`/hrms/employees?${params}`),
                axiosInstance.get('/hrms/documents?documentType=Offer Letter')
            ]);
            
            const emps = empRes.data?.data?.employees || [];
            const docsList = docRes.data?.data || [];
            
            const docMap = {};
            docsList.forEach(doc => {
                docMap[doc.employeeId] = doc;
            });
            
            setEmployees(emps);
            setDocuments(docMap);
        } catch (e) { 
            console.error(e);
        } finally { 
            setLoading(false); 
        }
    }, [search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
            return toast.error('Please upload a valid image file (JPG, PNG, WEBP)');
        }
        if (selected.size > 5 * 1024 * 1024) {
            return toast.error('File size must be less than 5MB');
        }
        
        setFile(selected);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selected);
    };

    const handleUpload = async () => {
        if (!file || !selectedEmployee) return;
        setUploading(true);
        
        try {
            // If replacing, delete old one first
            const existingDoc = documents[selectedEmployee._id];
            if (existingDoc) {
                await axiosInstance.delete(`/hrms/documents/${existingDoc._id}`);
            }

            // Upload image to Cloudinary via backend proxy
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'hrms/offer-letters');
            
            const uploadRes = await axiosInstance.post('/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = uploadRes.data?.data?.url;
            
            if (!imageUrl) throw new Error('Failed to get image URL');

            // Save document record
            await axiosInstance.post('/hrms/documents', {
                employeeId: selectedEmployee._id,
                documentType: 'Offer Letter',
                name: `${selectedEmployee.adminId?.name} - Offer Letter`,
                url: imageUrl
            });

            toast.success('Offer Letter uploaded successfully');
            closeUploadModal();
            fetchData();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this offer letter?')) return;
        try {
            await axiosInstance.delete(`/hrms/documents/${docId}`);
            toast.success('Offer Letter deleted');
            fetchData();
        } catch (e) {
            toast.error('Failed to delete document');
        }
    };

    const openUploadModal = (emp) => {
        setSelectedEmployee(emp);
        setUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setUploadModalOpen(false);
        setSelectedEmployee(null);
        setFile(null);
        setPreview('');
    };

    const openPreview = (doc) => {
        setSelectedDocument(doc);
        setPreviewModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Employee Documents</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage offer letters and official records</p>
                </div>
                <div className="relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search employees..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 pr-4 h-10 w-full sm:w-64 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Employee</th>
                                    <th className="px-6 py-4 font-medium">Department</th>
                                    <th className="px-6 py-4 font-medium">Offer Letter Status</th>
                                    <th className="px-6 py-4 font-medium">Upload Date</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map(emp => {
                                    const doc = documents[emp._id];
                                    const hasDoc = !!doc;
                                    return (
                                        <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                                                        {(emp.adminId?.name || 'E').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{emp.adminId?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-slate-500">{emp.adminId?.email || 'No email'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{emp.department || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                {hasDoc ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Uploaded
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {hasDoc ? new Date(doc.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {hasDoc ? (
                                                        <>
                                                            <button onClick={() => openPreview(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Preview">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <a href={doc.url} download target="_blank" rel="noopener noreferrer" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download">
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                            <button onClick={() => openUploadModal(emp)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Replace">
                                                                <Upload className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(doc._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => openUploadModal(emp)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors">
                                                            <Upload className="w-3.5 h-3.5" /> Upload
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900">
                                {documents[selectedEmployee?._id] ? 'Replace' : 'Upload'} Offer Letter
                            </h3>
                            <button onClick={closeUploadModal} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">
                                Employee: <span className="font-semibold text-slate-900">{selectedEmployee?.adminId?.name}</span>
                            </p>
                            
                            <div 
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${preview ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-500 hover:bg-orange-50/50'}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/jpeg,image/png,image/webp" 
                                    onChange={handleFileChange} 
                                />
                                {preview ? (
                                    <div className="space-y-3">
                                        <img src={preview} alt="Preview" className="h-32 object-contain mx-auto rounded-lg shadow-sm" />
                                        <p className="text-sm font-medium text-orange-600">Click to change image</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                                        <p className="text-xs text-slate-500">JPG, PNG, WEBP (Max 5MB)</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={closeUploadModal} className="px-4 h-10 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors text-sm">
                                    Cancel
                                </button>
                                <button onClick={handleUpload} disabled={!file || uploading} className="px-4 h-10 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
                                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {uploading ? 'Uploading...' : 'Save Document'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewModalOpen && selectedDocument && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
                    <div className="flex items-center justify-between p-4 text-white">
                        <div>
                            <h3 className="font-medium">{selectedDocument.name}</h3>
                            <p className="text-xs text-slate-400">Uploaded {new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href={selectedDocument.url} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-orange-400 transition-colors">
                                <Download className="w-4 h-4" /> Download
                            </a>
                            <button onClick={() => setPreviewModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                        <img 
                            src={selectedDocument.url} 
                            alt="Document Preview" 
                            className="max-w-full max-h-full object-contain cursor-zoom-in rounded-lg shadow-2xl"
                            onClick={(e) => e.target.classList.toggle('scale-150')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

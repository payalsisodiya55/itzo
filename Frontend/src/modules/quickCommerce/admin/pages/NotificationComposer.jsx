import React, { useState } from 'react';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import PageHeader from '@shared/components/ui/PageHeader';
import { useToast } from '@shared/components/ui/Toast';
import {
    HiOutlinePaperAirplane,
    HiOutlineBars3BottomLeft,
    HiOutlineLink,
    HiOutlineUsers,
    HiOutlineMapPin,
    HiOutlineClock,
    HiOutlinePhoto,
    HiOutlineDevicePhoneMobile,
    HiOutlineSparkles,
    HiOutlineBolt,
    HiOutlineExclamationCircle,
    HiOutlineCheckCircle,
    HiOutlineChartBar
} from 'react-icons/hi2';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useSettings } from '@core/context/SettingsContext';

const NotificationComposer = () => {
    const { showToast } = useToast();
    const { settings } = useSettings();
    const appName = (settings?.appName || 'App').toUpperCase();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [deepLink, setDeepLink] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [location, setLocation] = useState('all');
    const [lastOrder, setLastOrder] = useState('any');

    const segments = [
        { id: 'all', label: 'All Users', count: '12,504', description: 'Universal Reach', icon: HiOutlineUsers, color: 'blue' },
        { id: 'lapsed', label: 'Lapsed Customers', count: '3,210', description: 'No order in 30 days', icon: HiOutlineClock, color: 'amber' },
        { id: 'power', label: 'Power Users', count: '850', description: '10+ orders monthly', icon: HiOutlineSparkles, color: 'purple' },
        { id: 'new', label: 'Recent Signups', count: '1,420', description: 'Last 7 days', icon: HiOutlineCheckCircle, color: 'emerald' },
    ];

    const handleSend = () => {
        if (!title || !message) {
            showToast('Please complete the notification broadcast fields', 'warning');
            return;
        }
        showToast(`Broadcasting to ${segments.find(s => s.id === selectedSegment)?.count} users...`, 'info');
        setTimeout(() => {
            showToast('Campaign launched successfully!', 'success');
            setTitle('');
            setMessage('');
        }, 1500);
    };

    return (
        <div className="ds-section-spacing">
            {/* Header */}
            <PageHeader
                title="Growth Signal"
                description="Create and send targeted notifications to keep customers engaged."
                badge={
                    <Badge variant="warning" className="ds-badge ds-badge-warning">
                        Push Engine
                    </Badge>
                }
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                            <HiOutlineChartBar className="ds-icon-sm text-slate-400" />
                            <div className="text-left">
                                <p className="ds-caption text-slate-400">Quota</p>
                                <p className="ds-body font-bold text-slate-900">45,000 / 50K</p>
                            </div>
                        </div>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Composer Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="ds-card-standard">
                        <div className="space-y-6">
                            {/* Card Header */}
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                <div className="ds-stat-card-icon bg-primary/10">
                                    <HiOutlinePaperAirplane className="ds-icon-lg text-primary -rotate-45" />
                                </div>
                                <div>
                                    <h3 className="ds-h3">Campaign Composer</h3>
                                    <p className="ds-caption text-slate-400">Design your notification</p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-5">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="ds-label">Notification Title</label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="E.g. Hot Deals are back! 🔥"
                                        className="ds-input w-full"
                                        maxLength={50}
                                    />
                                    <p className="ds-caption text-slate-400 text-right">{title.length}/50</p>
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <label className="ds-label">Broadcast Message</label>
                                    <textarea
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Enter your push notification body text..."
                                        className="ds-textarea w-full resize-none"
                                        maxLength={200}
                                    />
                                    <p className="ds-caption text-slate-400 text-right">{message.length}/200</p>
                                </div>

                                {/* Deep Link & Image */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="ds-label">Deep Link (Optional)</label>
                                        <div className="relative">
                                            <HiOutlineLink className="absolute left-3 top-1/2 -translate-y-1/2 ds-icon-sm text-slate-400" />
                                            <input
                                                value={deepLink}
                                                onChange={(e) => setDeepLink(e.target.value)}
                                                className="ds-input w-full pl-9"
                                                placeholder="/deals/category"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="ds-label">Image URL (Optional)</label>
                                        <div className="relative">
                                            <HiOutlinePhoto className="absolute left-3 top-1/2 -translate-y-1/2 ds-icon-sm text-slate-400" />
                                            <input
                                                value={imageUrl}
                                                onChange={(e) => setImageUrl(e.target.value)}
                                                className="ds-input w-full pl-9"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={handleSend}
                                disabled={!title || !message}
                                className="ds-btn ds-btn-lg w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <HiOutlineBolt className="ds-icon-md text-amber-400" />
                                BLAST SIGNAL
                            </button>
                        </div>
                    </Card>

                    {/* Tips Card */}
                    <Card className="ds-card-compact bg-blue-50 border-blue-100">
                        <div className="flex gap-3">
                            <HiOutlineExclamationCircle className="ds-icon-lg text-blue-600 flex-shrink-0" />
                            <div>
                                <h4 className="ds-h4 text-blue-900 mb-1">Best Practices</h4>
                                <ul className="ds-body text-blue-700 space-y-1">
                                    <li>• Keep titles under 40 characters for better visibility</li>
                                    <li>• Use emojis sparingly to grab attention</li>
                                    <li>• Test with different audience segments</li>
                                    <li>• Schedule during peak engagement hours</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar - Preview & Audience */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Real-time Preview */}
                    <div className="space-y-3">
                        <h3 className="ds-h4 px-1">Protocol Preview</h3>
                        <Card className="ds-card-standard bg-gradient-to-br from-slate-900 to-slate-800 border-none">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="ds-caption text-slate-400">Live Preview</span>
                                    <Badge variant="success" className="ds-badge ds-badge-success text-[8px]">
                                        LOCKED
                                    </Badge>
                                </div>

                                {/* iOS Style Notification */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/10 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 bg-primary rounded-lg flex items-center justify-center">
                                                <HiOutlineDevicePhoneMobile className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{appName}</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-white/90">Just Now</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1.5 truncate">
                                            {title || 'Hot Deals are back! 🔥'}
                                        </h4>
                                        <p className="text-xs font-medium text-white/95 line-clamp-3 leading-relaxed">
                                            {message || 'Type your message to see it reflect here in real-time...'}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </Card>
                    </div>

                    {/* Audience Segmentation */}
                    <div className="space-y-3">
                        <h3 className="ds-h4 px-1">Audience Segmentation</h3>
                        <div className="space-y-2">
                            {segments.map((seg) => (
                                <button
                                    key={seg.id}
                                    onClick={() => setSelectedSegment(seg.id)}
                                    className={cn(
                                        "w-full p-4 rounded-xl text-left transition-all",
                                        selectedSegment === seg.id
                                            ? "bg-slate-900 text-white shadow-lg ring-2 ring-slate-900"
                                            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg flex-shrink-0",
                                            selectedSegment === seg.id ? "bg-white/10" : `bg-${seg.color}-50`
                                        )}>
                                            <seg.icon className={cn(
                                                "ds-icon-md",
                                                selectedSegment === seg.id ? "text-white" : `text-${seg.color}-600`
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="ds-body font-bold truncate">{seg.label}</h4>
                                                <span className={cn(
                                                    "ds-body font-bold",
                                                    selectedSegment === seg.id ? "text-primary" : "text-slate-900"
                                                )}>
                                                    {seg.count}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "ds-caption",
                                                selectedSegment === seg.id ? "text-white/60" : "text-slate-400"
                                            )}>
                                                {seg.description}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationComposer;

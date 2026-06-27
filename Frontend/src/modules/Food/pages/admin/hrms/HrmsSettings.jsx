import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@food/components/ui/Card';
import { Input } from '@food/components/ui/Input';
import { Button } from '@food/components/ui/Button';
import { Settings, Save, Clock, Users, Building2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function HrmsSettings() {
    const [loading, setLoading] = useState(false);

    const handleSave = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('HRMS Settings updated successfully');
        }, 1000);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto pb-24">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">HRMS Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Dynamically configure all company policies, payroll rules, and organization structure.</p>
                </div>
                <Button onClick={handleSave} disabled={loading} className="gap-2 min-w-[120px]">
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-primary rounded-lg"><Clock className="w-5 h-5" /></div>
                            <div>
                                <CardTitle>Working Hours & Policies</CardTitle>
                                <CardDescription>Configure minimum hours and grace periods.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Minimum Working Hours</label>
                            <Input type="number" defaultValue={8} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Grace Period (Minutes)</label>
                            <Input type="number" defaultValue={15} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Short Hour Deduction Rate</label>
                            <Input type="number" defaultValue={1} step="0.1" />
                            <p className="text-xs text-gray-500">Multiplier for hourly deduction.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Overtime Rate</label>
                            <Input type="number" defaultValue={1.5} step="0.1" />
                            <p className="text-xs text-gray-500">Multiplier for hourly bonus.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-primary rounded-lg"><Users className="w-5 h-5" /></div>
                            <div>
                                <CardTitle>Leave Policies</CardTitle>
                                <CardDescription>Configure paid leave allocations.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Paid Leaves Per Month</label>
                            <Input type="number" defaultValue={1.5} step="0.5" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Max Accumulated Leaves</label>
                            <Input type="number" defaultValue={18} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-primary rounded-lg"><Building2 className="w-5 h-5" /></div>
                            <div>
                                <CardTitle>Organization Structure</CardTitle>
                                <CardDescription>Departments and designations.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center text-sm text-gray-500">
                            Department and Designation management UI goes here.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

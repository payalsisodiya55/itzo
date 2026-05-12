import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
    label, 
    value, 
    icon: Icon, 
    trend, 
    trendDirection = 'up',
    description,
    color = 'text-blue-600',
    bg = 'bg-blue-50',
    onClick,
    className 
}) => {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "ds-stat-card group",
                onClick && "cursor-pointer",
                className
            )}
        >
            <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-start">
                    <div className={cn("ds-stat-card-icon", bg)}>
                        {Icon && <Icon className={cn("ds-icon-lg", color)} strokeWidth={2.5} />}
                    </div>
                    {trend && (
                        <div className={cn(
                            "ds-stat-card-trend",
                            trendDirection === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                        )}>
                            {trendDirection === 'up' ? (
                                <TrendingUp className="ds-icon-sm mr-0.5" />
                            ) : (
                                <TrendingDown className="ds-icon-sm mr-0.5" />
                            )}
                            {trend}
                        </div>
                    )}
                </div>
                <div>
                    <p className="ds-caption mb-1.5">{label}</p>
                    <p className="ds-stat-large">{value}</p>
                    {description && <p className="ds-description mt-1">{description}</p>}
                </div>
            </div>
        </div>
    );
};

export default StatCard;

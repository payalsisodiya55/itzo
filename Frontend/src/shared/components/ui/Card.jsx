import React from 'react';
import {
    Card as ShadcnCard,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from '@/lib/utils';

const Card = ({ children, title, subtitle, className, headerAction, footer, ...props }) => {
    return (
        <ShadcnCard className={cn("glass-card border-none rounded-lg", className)} {...props}>
            {(title || subtitle || headerAction) && (
                <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-gray-100/50 bg-gray-50/20 px-5 py-4">
                    <div className="space-y-1">
                        {title && <CardTitle className="text-base font-semibold text-gray-900 tracking-tight">{title}</CardTitle>}
                        {subtitle && <CardDescription className="text-xs font-medium text-gray-500">{subtitle}</CardDescription>}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </CardHeader>
            )}
            <CardContent className={cn("p-5", !title && !subtitle && !headerAction && "pt-5")}>
                {children}
            </CardContent>
            {footer && (
                <CardFooter className="bg-gray-50/40 border-t border-gray-100/50 px-5 py-3">
                    {footer}
                </CardFooter>
            )}
        </ShadcnCard>
    );
};

export default Card;


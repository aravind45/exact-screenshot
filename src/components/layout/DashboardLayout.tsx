
import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string; // Optional prop to control max width of content
}

export function DashboardLayout({
    children,
    className,
    maxWidth = "max-w-[1440px]"
}: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            {/* 
         Margin-left matches the sidebar width defined in CSS variable or fixed width.
         Using standard w-[240px] for sidebar, so ml-[240px] here.
      */}
            <div className="flex-1 ml-[240px] flex flex-col transition-all duration-300">
                <main
                    className={cn(
                        "w-full mx-auto px-6 py-6 sm:px-8 sm:py-8 space-y-8",
                        maxWidth,
                        className
                    )}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}

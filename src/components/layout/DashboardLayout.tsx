
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
         Sidebar is w-[220px], so ml-[220px] here.
      */}
            <div className="flex-1 ml-[220px] flex flex-col transition-all duration-300">
                <main
                    className={cn(
                        "w-full px-5 py-5 sm:px-7 sm:py-6 space-y-5",
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

"use client";

import { useSidebar } from "@/contexts/SidebarContext";

export default function MobileContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 transition-all duration-300 ease-in-out min-w-0">
      <div className="lg:pt-16">
        {children}
      </div>
    </div>
  );
}


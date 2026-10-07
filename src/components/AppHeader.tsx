import type { ReactNode } from "react";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";

interface AppHeaderProps {
  children?: ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
  return (
    <nav className="flex items-center justify-between flex-wrap gap-y-3 px-5 py-2 min-h-[60px]">
      <a href={LANDING_URL} className="inline-flex items-center hover:opacity-75 transition-opacity duration-200">
        <BrandName height={32} />
      </a>
      {children}
    </nav>
  );
}

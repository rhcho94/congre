import type { ReactNode } from "react";
import { BrandName } from "@/components/BrandName";
import { LANDING_URL } from "@/lib/constants";

interface AppHeaderProps {
  children?: ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
  return (
    <nav className="flex items-center justify-between flex-wrap gap-y-3 px-5 sm:px-8 py-6">
      <a href={LANDING_URL} className="text-xl tracking-wider hover:opacity-75 transition-opacity duration-200">
        <BrandName />
      </a>
      {children}
    </nav>
  );
}

import { SpotlightBackground } from "@/components/ui/spotlight-background";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SpotlightBackground>
            <Header />
            <div className="pt-16">
                {children}
            </div>
        </SpotlightBackground>
    );
}

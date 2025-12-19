"use client";

import React from "react";
import { SectionTitle } from "@/components/docs/section-title";
import { TerminalCodeBlock } from "@/components/docs/terminal-code-block";
import { ArchitectureDiagram } from "@/components/docs/architecture-diagram";

export default function TestDocsPage() {
    const exampleCode = `// Initialize Exo SDK
import { ExoCore } from "@exo/sdk";

const exo = new ExoCore({
  connection: "devnet",
  identity: "my-agent-nft-id"
});

await exo.execute("skill-scan-security-v1", {
  target: "0x123...456"
});`;

    return (
        <div className="min-h-screen bg-[#09090B] p-8 sm:p-20">
            <div className="mx-auto max-w-4xl space-y-12">
                <div>
                    <h1 className="mb-4 text-4xl font-black tracking-tighter text-white">Documentation Components Test</h1>
                    <p className="text-zinc-400">Verifying Task-01, Task-04, and Task-06 implementation.</p>
                </div>

                {/* Section Title Component */}
                <section>
                    <SectionTitle number="01" title="Protocol Overview" />
                    <p className="mt-4 text-zinc-300">
                        The documentation components are designed to follow the Developer Luxury aesthetic.
                    </p>
                </section>

                {/* Terminal Code Block Component */}
                <section>
                    <SectionTitle number="02" title="Installation" />
                    <TerminalCodeBlock
                        code="pnpm add @exo-protocol/sdk"
                        filename="Terminal"
                    />
                    <TerminalCodeBlock
                        code={exampleCode}
                        language="typescript"
                        filename="src/example.ts"
                    />
                </section>

                {/* Architecture Diagram Component */}
                <section>
                    <SectionTitle number="03" title="System Architecture" />
                    <ArchitectureDiagram />
                </section>
            </div>
        </div>
    );
}

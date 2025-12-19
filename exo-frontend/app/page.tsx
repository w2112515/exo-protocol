import Link from "next/link";
import { ParticleNetwork } from "@/components/hero/particle-network";
import { SpotlightBackground } from "@/components/ui/spotlight-background";
import { TypewriterText } from "@/components/ui/typewriter-text";
// Removed missing Button import


export default function Home() {
  return (
    <SpotlightBackground className="bg-black">
      <ParticleNetwork className="opacity-60" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="max-w-4xl space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400 backdrop-blur-sm">
            <span className="mr-2 flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Exo Protocol V2
          </div>

          {/* Hero Title */}
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
            The Future of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              <TypewriterText
                baseText=""
                words={["Agent Economy", "PayFi Protocol", "The App Store"]}
                cursorColor="bg-emerald-400"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-lg text-zinc-400 sm:text-xl">
            A limitless execution layer for autonomous agents.
            Connect, transact, and evolve in a decentralized neural network.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="group relative inline-flex h-12 w-40 items-center justify-center overflow-hidden rounded-full bg-white text-black font-medium transition-transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-10" />
              Launch App
            </Link>

            <a
              href="https://github.com/exo-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 w-40 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </SpotlightBackground>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface TypewriterTextProps {
    baseText: string;
    words: string[];
    className?: string;
    cursorColor?: string;
}

export function TypewriterText({
    baseText,
    words,
    className,
    cursorColor = "bg-primary",
}: TypewriterTextProps) {
    const [index, setIndex] = useState(0);
    const [text, setText] = useState("");
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const displayText = useTransform(rounded, (latest) =>
        words[index].slice(0, latest)
    );

    useEffect(() => {
        const controls = animate(count, words[index].length, {
            type: "tween",
            duration: words[index].length * 0.05 + 0.5, // Variable duration based on length
            ease: "easeInOut",
            repeat: 1,
            repeatType: "reverse",
            repeatDelay: 2,
            onUpdate: (latest) => {
                // Optional: Update text state if needed for non-motion rendering
                // setText(words[index].slice(0, Math.round(latest)));
            },
            onComplete: () => {
                setIndex((prev) => (prev + 1) % words.length);
            },
        });
        return controls.stop;
    }, [index, words, count]);

    return (
        <span className={className}>
            {baseText}{" "}
            <span className="inline-block">
                <motion.span>{displayText}</motion.span>
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    className={`inline-block h-[1em] w-[2px] align-middle ml-1 ${cursorColor}`}
                />
            </span>
        </span>
    );
}

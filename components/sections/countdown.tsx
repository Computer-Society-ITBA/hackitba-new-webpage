"use client"

import React, { useEffect, useState, useRef } from "react"
// @ts-ignore
import Confetti from "confetti-react"
import { NeonGlow } from "@/components/effects/neon-glow"

interface CountdownProps {
    translations: any
}

export function Countdown({ translations }: CountdownProps) {
    const calculateTimeLeft = () => {
        // March 27, 2026 at 18:00
        const targetDate = new Date("2026-03-27T18:00:00")
        const difference = targetDate.getTime() - new Date().getTime()

        let timeLeft: any = {}

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            }
        } else {
            timeLeft = null
        }
        return timeLeft
    }

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())
    const [isClient, setIsClient] = useState(false)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const [confettiSource, setConfettiSource] = useState({
        x: 100,
        y: -40,
        w: 200,
        h: 0,
    })
    const [height, setHeight] = useState(0)

    useEffect(() => {
        setIsClient(true)
        if (typeof window !== "undefined") {
            setHeight(window.innerHeight)
        }

        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect()
            const x = rect.left + window.scrollX + rect.width / 2
            const y = rect.top + window.scrollY + rect.height
            setConfettiSource({ x, y, w: 0, h: 0 })
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)
        return () => clearTimeout(timer)
    })

    if (!isClient) return null

    return (
        <section className="py-20 px-4 flex flex-col items-center gap-8 w-auto mx-4">
            {timeLeft ? (
                <div className="flex flex-col items-center mb-12">
                    <div>
                        <p className="font-pixel text-md text-brand-yellow mb-2">GET</p>
                        <p className="font-pixel text-lg text-brand-yellow">{translations.countdown.endpoint}</p>
                    </div>
                </div>
            ) : (
                <h3 className="text-brand-yellow font-pixel text-2xl">{translations.countdown.ended}</h3>
            )}

            <div ref={wrapperRef} className="flex justify-center gap-4 sm:gap-8 md:gap-12 px-4 transition-transform">
                {!timeLeft && (
                    <Confetti
                        height={height}
                        recycle={false}
                        confettiSource={confettiSource}
                        colors={["#afeff3", "#ef802f", "#fad399"]}
                        initialVelocityY={3}
                        initialVelocityX={4}
                        gravity={0.02}
                    />
                )}

                <div className="text-center">
                    <p className="font-pixel text-4xl sm:text-5xl md:text-6xl text-brand-yellow transition-all duration-300">
                        <NeonGlow flickering color="orange">
                            {timeLeft ? timeLeft.days : "0"}
                        </NeonGlow>
                    </p>
                    <p className="text-brand-yellow text-xs sm:text-sm md:text-xl font-pixel mt-2">{translations.countdown.days}</p>
                </div>

                <div className="text-center">
                    <p className="font-pixel text-4xl sm:text-5xl md:text-6xl text-brand-yellow transition-colors duration-300">
                        <NeonGlow flickering color="orange">
                            {timeLeft ? timeLeft.hours : "0"}
                        </NeonGlow>
                    </p>
                    <p className="text-brand-yellow text-xs sm:text-sm md:text-xl font-pixel mt-2">{translations.countdown.hours}</p>
                </div>

                <div className="text-center">
                    <p className="font-pixel text-4xl sm:text-5xl md:text-6xl text-brand-yellow transition-colors duration-300">
                        <NeonGlow flickering color="orange">
                            {timeLeft ? timeLeft.minutes : "0"}
                        </NeonGlow>
                    </p>
                    <p className="text-brand-yellow text-xs sm:text-sm md:text-xl font-pixel mt-2">{translations.countdown.minutes}</p>
                </div>

                <div className="text-center">
                    <p className="font-pixel text-4xl sm:text-5xl md:text-6xl text-brand-yellow transition-colors duration-300">
                        <NeonGlow flickering color="orange">
                            {timeLeft ? timeLeft.seconds : "0"}
                        </NeonGlow>
                    </p>
                    <p className="text-brand-yellow text-xs sm:text-sm md:text-xl font-pixel mt-2">{translations.countdown.seconds}</p>
                </div>
            </div>
        </section>
    )
}

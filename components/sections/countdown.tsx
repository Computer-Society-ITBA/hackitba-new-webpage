"use client"

import React, { useEffect, useState } from "react"
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

    useEffect(() => {
        setIsClient(true)
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

            <div className="flex justify-center gap-4 sm:gap-8 md:gap-12 px-4 transition-transform">
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

import { useEffect, useRef, useState } from "react"

/**
 * @name Time
 * @description Time as minutes and seconds.
 */
type Time = {
    minutes: number
    seconds: number
}

/**
 * @name Countdown
 * @description State of the countdown timer.
 */
type Countdown = {
    minutes: number
    seconds: number
    formatted: string
    isActive: boolean
    isInactive: boolean
    isRunning: boolean
    isPaused: boolean
    start: VoidFunction
    pause: VoidFunction
    resume: VoidFunction
    reset: (time?: Time) => void
}

function formatDuration(ms: number, fmt: string): string {
    const h = Math.floor(ms / (60 * 60 * 1000));
    const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const s = Math.floor((ms % (60 * 1000)) / 1000);

    // Replace tokens in the format string
    const tokens: Record<string, string> = {
        hh: String(h).padStart(2, "0"),
        h: String(h),
        mm: String(m).padStart(2, "0"),
        m: String(m),
        ss: String(s).padStart(2, "0"),
        s: String(s),
    };

    // Replace only valid tokens
    return fmt.replace(/\b(hh|h|mm|m|ss|s)\b/g, t => tokens[t]);
}

const calculateInitialTime = ({minutes, seconds}: Time): number => {
    const initialMinutes = minutes * 60 * 1000
    const initialSeconds = seconds * 1000
    const initialTime = initialMinutes + initialSeconds

    return initialTime
}

const calculateRemainingMinutes = (remainingTime: number): number =>
    Math.floor(remainingTime / (60 * 1000))

const calculateRemainingSeconds = (remainingTime: number): number =>
    Math.floor((remainingTime / 1000) % 60)

type useCountdownParams = {
    minutes?: number
    seconds?: number
    format?: string
    autoStart?: boolean
    onCompleted?: VoidFunction
}

/**
 * @name useCountdown
 * @description React hook countdown timer.
 */
const useCountdown = ({
    minutes = 0,
    seconds = 0,
    format = "mm:ss",
    autoStart = false,
    onCompleted,
}: useCountdownParams = {}): Countdown => {
    const id = useRef(0)

    // time
    const [remainingTimeMs, setRemainingTimeMs] = useState(
        calculateInitialTime({minutes, seconds}),
    )

    // status
    const [isActive, setIsActive] = useState(false)
    const [isInactive, setIsInactive] = useState(true)
    const [isRunning, setIsRunning] = useState(false)
    const [isPaused, setIsPaused] = useState(false)

    useEffect(
        () => {
            if (autoStart) {
                id.current = window.setInterval(calculateRemainingTime, 1000)

                setIsActive(true)
                setIsInactive(false)
                setIsRunning(true)
                setIsPaused(false)
            }

            return () => window.clearInterval(id.current)
        },

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const calculateRemainingTime = () => {
        setRemainingTimeMs(time => {
            if (time - 1000 <= 0) {
                window.clearInterval(id.current)
                onCompleted?.()

                setIsActive(false)
                setIsInactive(true)
                setIsRunning(false)
                setIsPaused(false)

                return 0
            }

            return time - 1000
        })
    }

    const pause = (): void => {
        if (isPaused || isInactive) {
            return
        }

        window.clearInterval(id.current)

        setIsActive(true)
        setIsInactive(false)
        setIsRunning(false)
        setIsPaused(true)
    }

    const start = (): void => {
        if (isRunning) {
            return
        }

        id.current = window.setInterval(calculateRemainingTime, 1000)

        setIsActive(true)
        setIsInactive(false)
        setIsRunning(true)
        setIsPaused(false)
    }

    const reset = (time: Time = {minutes, seconds}) => {
        window.clearInterval(id.current)

        if (autoStart) {
            id.current = window.setInterval(calculateRemainingTime, 1000)

            setIsActive(true)
            setIsInactive(false)
            setIsRunning(true)
            setIsPaused(false)
        } else {
            setIsActive(false)
            setIsInactive(true)
            setIsRunning(false)
            setIsPaused(false)
        }

        setRemainingTimeMs(calculateInitialTime(time))
    }

    const countdown: Countdown = {
        minutes: calculateRemainingMinutes(remainingTimeMs),
        seconds: calculateRemainingSeconds(remainingTimeMs),
        formatted: formatDuration(remainingTimeMs, format),
        isActive,
        isInactive,
        isRunning,
        isPaused,
        start,
        pause,
        resume: start,
        reset,
    }

    return countdown
}

export default useCountdown
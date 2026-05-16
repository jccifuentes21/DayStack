import { useEffect, useRef } from "react";
import type { Day } from "../types/api";

interface Props {
  days: Day[];
  selectedDayId: number | null;
  today: string;
  onSelect: (dayId: number) => void;
  loading: boolean;
}

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const typeColor: Record<string, string> = {
  full: "var(--full)",
  half: "var(--half)",
  light: "var(--light)",
};

const DayPill = ({
  day,
  isSelected,
  isToday,
  onSelect,
}: {
  day: Day;
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
}) => {
  const date = new Date(day.date + "T00:00:00");
  const abbr = DAY_ABBR[date.getDay()];
  const num = date.getDate();
  const hasType = day.day_type !== "unset";
  const dotColor = hasType ? typeColor[day.day_type] : undefined;
  const total = day.tasks.length;
  const done = day.tasks.filter((t) => t.completed).length;
  const showDot = total > 0;

  return (
    <button
      onClick={onSelect}
      aria-label={`${abbr} ${num}`}
      aria-pressed={isSelected}
      style={{
        flexShrink: 0,
        minWidth: 52,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        background: isToday
          ? "var(--accent-bg)"
          : isSelected
            ? "var(--surface-2)"
            : "transparent",
        transition:
          "background 150ms var(--ease-out), transform 120ms var(--ease-out)",
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.95)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: isToday
            ? "var(--accent)"
            : isSelected
              ? "var(--text-1)"
              : "var(--text-3)",
        }}
      >
        {abbr}
      </span>

      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 15,
          fontWeight: 500,
          color: isToday
            ? "var(--accent)"
            : isSelected
              ? "var(--text-1)"
              : "var(--text-2)",
          lineHeight: 1,
        }}
      >
        {num}
      </span>

      {/* Completion dot */}
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: showDot
            ? done === total
              ? dotColor
              : "var(--border)"
            : "transparent",
        }}
      />
    </button>
  );
};

const SkeletonPill = () => (
  <div
    style={{
      minWidth: 52,
      height: 68,
      borderRadius: 10,
      background: "var(--surface)",
      flexShrink: 0,
      opacity: 0.4,
    }}
  />
);

const WeekStrip = ({
  days,
  selectedDayId,
  today,
  onSelect,
  loading,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll today's pill into view on first load
  useEffect(() => {
    if (!scrollRef.current || days.length === 0) return;
    const todayIndex = days.findIndex((d) => d.date === today);
    if (todayIndex === -1) return;
    const pill = scrollRef.current.children[todayIndex] as HTMLElement;
    if (pill)
      pill.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      });

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.length]);

  return (
    <div
      ref={scrollRef}
      style={{
        display: "flex",
        gap: 4,
        overflowX: "auto",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch" as never,
        // Padding on the scroll container so first/last pills have breathing room
        paddingInline: "16px",
        scrollPaddingInline: "16px",
        paddingBlock: "2px",
      }}
    >
      {loading && days.length === 0
        ? Array.from({ length: 7 }, (_, i) => <SkeletonPill key={i} />)
        : days.map((day) => (
            <DayPill
              key={day.id}
              day={day}
              isSelected={day.id === selectedDayId}
              isToday={day.date === today}
              onSelect={() => onSelect(day.id)}
            />
          ))}
    </div>
  );
};

export default WeekStrip;

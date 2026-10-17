import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import {
  words,
  MIN_PLAYERS,
  MAX_PLAYERS,
  type GameSettings,
} from "../../game";
import "../../App.css"; // shared theme (game-page, corner, start-button ...)
import "./Cards.css";

// Strict check: the page opens only with valid data coming from Home
const isValidSettings = (s: unknown): s is GameSettings => {
  if (!s || typeof s !== "object") return false;
  const { category, players, time } = s as Record<string, unknown>;

  return (
    typeof category === "string" &&
    Array.isArray(words[category]) &&
    words[category].length > 0 &&
    typeof players === "number" &&
    Number.isInteger(players) &&
    players >= MIN_PLAYERS &&
    players <= MAX_PLAYERS &&
    typeof time === "number" &&
    time > 0
  );
};

const formatTime = (total: number) => {
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
};

// Wrapper: guard first, hooks live in a component that always has valid settings
function Cards() {
  const { state } = useLocation();

  if (!isValidSettings(state)) return <Navigate to="/" replace />;
  return <Game settings={state} />;
}

function Game({ settings }: { settings: GameSettings }) {
  const { category, players, time } = settings;
  const navigate = useNavigate();

  // picked once per game
  const [secretWord] = useState(() => {
    const list = words[category];
    return list[Math.floor(Math.random() * list.length)];
  });
  const [spyIndex] = useState(() => Math.floor(Math.random() * players));

  const [current, setCurrent] = useState(0); // which player's card is on screen
  const [isOpen, setIsOpen] = useState(false); // card is face-up
  const [isDone, setIsDone] = useState(false); // player saw it and hid it again
  const [endAt, setEndAt] = useState<number | null>(null); // timer end timestamp
  const [secondsLeft, setSecondsLeft] = useState(time * 60);

  const isLast = current === players - 1;
  const isSpy = current === spyIndex;
  const timerStarted = endAt !== null;

  // tap 1: reveal, tap 2: hide and lock (then "Next" appears)
  const handleCardClick = () => {
    if (isDone) return;

    if (!isOpen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setIsDone(true);
    }
  };

  const handleNext = () => {
    if (!isDone) return;

    if (isLast) {
      // START: timer begins now
      setEndAt(Date.now() + time * 60 * 1000);
      return;
    }

    setCurrent((c) => c + 1);
    setIsOpen(false);
    setIsDone(false);
  };

  // Timestamp-based timer: stays correct when the phone screen locks
  // or the browser throttles background tabs.
  useEffect(() => {
    if (endAt === null) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSecondsLeft(left);

      if (left === 0) {
        window.clearInterval(id);
        // replace: Back button can't return to the finished game
        navigate("/finish", { replace: true, state: { finished: true } });
      }
    };

    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endAt, navigate]);

  const subtitle = timerStarted
    ? "DISCUSS AND FIND THE SPY"
    : isDone
    ? isLast
      ? "ALL SET. PRESS START"
      : "HIDDEN. PASS THE PHONE"
    : isOpen
    ? "MEMORIZE, THEN TAP TO HIDE"
    : "TAP THE CARD TO REVEAL";

  const cardLabel = isOpen
    ? isSpy
      ? `Player ${current + 1} card: you are the spy`
      : `Player ${current + 1} card: secret word ${secretWord}`
    : `Player ${current + 1} card`;

  return (
    <main className="game-page cards-page">
      <div className="background-glow" />
      <div className="corner corner-top" />
      <div className="corner corner-bottom" />

      <section className="game-container">
        <header className="game-header">
          <span className="top-secret">
            CLASSIFIED // {category.toUpperCase()}
          </span>

          <h1 className="cards-title">
            {timerStarted ? "FIND THE SPY" : `PLAYER ${current + 1}`}
          </h1>

          <p className="game-description">{subtitle}</p>
        </header>

        {!timerStarted ? (
          <>
            <div className="card-stage">
              {/* key remounts the card for every player: starts face-down */}
              <button
                key={current}
                type="button"
                className={`card ${isOpen ? "is-open" : ""}`}
                onClick={handleCardClick}
                disabled={isDone}
                aria-pressed={isOpen}
                aria-label={cardLabel}
              >
                <span className="card-inner">
                  <span className="card-face card-front">
                    <span className="card-number">{current + 1}</span>
                    <span className="card-mark">?</span>
                  </span>

                  <span className="card-face card-back" aria-hidden="true">
                    {isSpy ? (
                      <>
                        <span className="card-role">YOU ARE</span>
                        <span className="card-spy">SPY</span>
                        <span className="card-hint">FIND THE WORD</span>
                      </>
                    ) : (
                      <>
                        <span className="card-role">SECRET WORD</span>
                        <span className="card-word">{secretWord}</span>
                      </>
                    )}
                  </span>
                </span>
              </button>
            </div>

            <p className="cards-progress">
              {current + 1} / {players}
            </p>

            {/* always in layout (no jump), visible only after the card is hidden */}
            <button
              type="button"
              className={`start-button next-button ${isDone ? "" : "is-hidden"}`}
              onClick={handleNext}
              disabled={!isDone}
              aria-hidden={!isDone}
              tabIndex={isDone ? 0 : -1}
            >
              <span>{isLast ? "START" : "NEXT PLAYER"}</span>
              <span className="start-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </>
        ) : (
          <div className="timer-box">
            <span className="timer-label">TIME LEFT</span>
            <span
              className={`timer-value ${secondsLeft <= 10 ? "is-danger" : ""}`}
              role="timer"
              aria-live="off"
            >
              {formatTime(secondsLeft)}
            </span>
          </div>
        )}
      </section>
    </main>
  );
}

export default Cards;
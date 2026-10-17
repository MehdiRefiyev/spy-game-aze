import { useEffect } from "react";
import { useForm } from "react-hook-form";
import "./App.css";
import wordsData from "./assets/data/words.json";
import { useNavigate } from "react-router";

const words = wordsData as Record<string, string[]>;
const categories = Object.keys(words);

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;

const timeOptions = [
  { id: 1, minutes: 1 },
  { id: 2, minutes: 3 },
  { id: 2, minutes: 5 },
  { id: 4, minutes: 10 },
  { id: 5, minutes: 15 },
  { id: 6, minutes: 20 },
  { id: 7, minutes: 25 },
];

interface Form {
  category: string;
  cardsCount: string;
  time: number;
}

function App() {
  const {
    register,
    setValue,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      category: categories[0] ?? "",
      cardsCount: "",
      time: timeOptions[0].minutes,
    },
  });

  useEffect(() => {
    register("time", {
      validate: (v) =>
        timeOptions.some((o) => o.minutes === v) || "Choose a valid duration",
    });
  }, [register]);

  const navigate = useNavigate();

  const time = watch("time");
  const cardsCount = watch("cardsCount");

  const playersNumber = Number(cardsCount);
  const showTimeWarning =
    /^\d+$/.test(cardsCount ?? "") &&
    playersNumber >= MIN_PLAYERS &&
    playersNumber <= MAX_PLAYERS &&
    time < Math.ceil(playersNumber * 0.5);

  const onSubmit = (formData: Form) => {
    const payload = {
      category: formData.category,
      players: Number(formData.cardsCount),
      time: formData.time,
    };
    navigate("/cards", { state: payload });
    reset();
  };

  return (
    <main className="game-page">
      <div className="background-glow" />

      <div className="corner corner-top" />
      <div className="corner corner-bottom" />

      <section className="game-container">
        <header className="game-header">
          <span className="top-secret">CLASSIFIED // LEVEL 01</span>

          <h1 className="game-title">
            <span>SPY</span>
            <span className="game-title-sub">GAME</span>
          </h1>

          <p className="game-description">
            CHOOSE YOUR SETTINGS
            <br />
            AND FIND THE SPY
          </p>
        </header>

        <form
          className="settings-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="setting-card">
            <div className="setting-icon" aria-hidden="true">
              ◎
            </div>

            <div className="setting-content">
              <label htmlFor="category">Category</label>

              <select
                id="category"
                aria-invalid={!!errors.category}
                aria-describedby="category-error"
                {...register("category", {
                  required: "Choose a category",
                  validate: {
                    exists: (v) => v in words || "Unknown category",
                    hasWords: (v) =>
                      (Array.isArray(words[v]) && words[v].length > 0) ||
                      "This category has no words",
                  },
                })}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {errors.category && (
                <small id="category-error" role="alert">
                  {errors.category.message}
                </small>
              )}
            </div>
          </div>

          <div className="setting-card">
            <div className="setting-icon" aria-hidden="true">
              ♟
            </div>

            <div className="setting-content">
              <label htmlFor="players">Number of Players</label>

              <div className="number-control">
                <input
                  id="players"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter player count"
                  aria-invalid={!!errors.cardsCount}
                  aria-describedby="players-hint"
                  {...register("cardsCount", {
                    setValueAs: (v: string) => (v ?? "").trim(),
                    required: "Please fill out this field",
                    validate: {
                      digitsOnly: (v) =>
                        /^\d+$/.test(v) || "Use digits only (whole numbers)",
                      min: (v) =>
                        Number(v) >= MIN_PLAYERS ||
                        `Minimum ${MIN_PLAYERS} players`,
                      max: (v) =>
                        Number(v) <= MAX_PLAYERS ||
                        `Maximum ${MAX_PLAYERS} players`,
                    },
                  })}
                />
              </div>

              <small
                id="players-hint"
                role={errors.cardsCount ? "alert" : undefined}
              >
                {errors.cardsCount
                  ? errors.cardsCount.message
                  : `Enter ${MIN_PLAYERS}–${MAX_PLAYERS} players`}
              </small>
            </div>
          </div>

          <div className="setting-card">
            <div className="setting-icon" aria-hidden="true">
              ◷
            </div>

            <div className="setting-content">
              <label id="duration-label">Game Duration</label>

              <div
                className="time-options"
                role="group"
                aria-labelledby="duration-label"
              >
                {timeOptions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`time-button ${
                      time === item.minutes ? "active" : ""
                    }`}
                    aria-pressed={time === item.minutes}
                    onClick={() =>
                      setValue("time", item.minutes, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    {item.minutes}
                  </button>
                ))}
              </div>

              <small className="minutes-label">MINUTES</small>

              {errors.time && (
                <small role="alert">{errors.time.message}</small>
              )}

              {showTimeWarning && (
                <small role="status">
                  Tip: {playersNumber} players may need more than {time}{" "}
                  {time === 1 ? "minute" : "minutes"}.
                </small>
              )}
            </div>
          </div>

          <button
            className={isValid ? "start-button" : "start-button disable"}
            type="submit"
            disabled={!isValid}
            aria-disabled={!isValid}
          >
            <span>START GAME</span>
            <span className="start-arrow" aria-hidden="true">
              →
            </span>
          </button>

          <p className="footer-note">
            <span className="status-dot" />
            YOUR MISSION BEGINS HERE
          </p>
        </form>
      </section>
    </main>
  );
}

export default App;
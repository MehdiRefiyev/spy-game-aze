import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import "./App.css";
import { useNavigate } from "react-router";
import {
  words,
  categories,
  MIN_PLAYERS,
  MAX_PLAYERS,
  maxSpiesFor,
  createGame,
  pickDistinct,
} from "./game";

const PREVIEW_COUNT = 4;

const timeOptions = [
  { id: 1, minutes: 1 },
  { id: 2, minutes: 3 },
  { id: 3, minutes: 5 }, // was id: 2 (duplicate React key)
  { id: 4, minutes: 10 },
  { id: 5, minutes: 15 },
  { id: 6, minutes: 20 },
  { id: 7, minutes: 25 },
];

interface Form {
  randomCategory: boolean;
  selectedCategories: string[];
  cardsCount: string;
  spies: number;
  time: number;
}

function App() {
  const {
    register,
    setValue,
    getValues,
    watch,
    reset,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Form>({
    mode: "onChange",
    defaultValues: {
      randomCategory: false,
      selectedCategories: categories[0] ? [categories[0]] : [],
      cardsCount: "",
      spies: 1,
      time: timeOptions[0].minutes,
    },
  });

  useEffect(() => {
    register("time", {
      validate: (v) =>
        timeOptions.some((o) => o.minutes === v) || "Choose a valid duration",
    });

    register("selectedCategories", {
      validate: (v) =>
        getValues("randomCategory") ||
        (v.length > 0 && v.every((c) => (words[c]?.length ?? 0) > 0)) ||
        "Choose at least one category",
    });

    register("spies", {
      validate: (v) => {
        if (!Number.isInteger(v) || v < 1) return "At least 1 spy";
        const players = Number(getValues("cardsCount"));
        const playersOk =
          Number.isInteger(players) &&
          players >= MIN_PLAYERS &&
          players <= MAX_PLAYERS;
        if (!playersOk) return true; // the players field shows its own error
        const max = maxSpiesFor(players);
        return v <= max || `Maximum ${max} spies for ${players} players`;
      },
    });
  }, [register, getValues]);

  const navigate = useNavigate();

  const randomCategory = watch("randomCategory");
  const selected = watch("selectedCategories");
  const cardsCount = watch("cardsCount");
  const spies = watch("spies");
  const time = watch("time");

  const playersNumber = Number(cardsCount);
  const playersValid =
    /^\d+$/.test(cardsCount ?? "") &&
    playersNumber >= MIN_PLAYERS &&
    playersNumber <= MAX_PLAYERS;

  const maxSpies = playersValid ? maxSpiesFor(playersNumber) : 1;
  const spyOptions = Array.from(
    { length: playersValid ? maxSpies : Math.max(1, spies) },
    (_, i) => i + 1,
  );

  // players count changed -> keep the spies number valid
  useEffect(() => {
    if (playersValid && spies > maxSpies) {
      setValue("spies", maxSpies, { shouldValidate: true, shouldDirty: true });
    }
  }, [playersValid, spies, maxSpies, setValue]);

  // preview only for exactly one manually chosen category
  const previewCategory =
    !randomCategory && selected.length === 1 ? selected[0] : null;
  const previewWords = useMemo(
    () =>
      previewCategory ? pickDistinct(words[previewCategory], PREVIEW_COUNT) : [],
    [previewCategory],
  );

  const toggleCategory = (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((c) => c !== name)
      : [...selected, name];
    setValue("selectedCategories", next, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const categoryHint = randomCategory
    ? "Automatic: the category is picked at random and stays hidden until the discussion starts."
    : selected.length > 1
    ? `${selected.length} selected: one is picked at random and stays hidden until the discussion starts.`
    : null;

  const showTimeWarning =
    playersValid && time < Math.ceil(playersNumber * 0.5);

  const onSubmit = (formData: Form) => {
    const game = createGame({
      categories: formData.selectedCategories,
      randomCategory: formData.randomCategory,
      players: Number(formData.cardsCount),
      spies: formData.spies,
      time: formData.time,
    });
    navigate("/cards", { state: game });
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
          {/* ===== Categories ===== */}
          <div className="setting-card">
            <div className="setting-icon" aria-hidden="true">
              ◎
            </div>

            <div className="setting-content">
              <label id="category-label">Categories</label>

              <div className="toggle-row">
                <input
                  id="random-category"
                  type="checkbox"
                  {...register("randomCategory", {
                    deps: ["selectedCategories"],
                  })}
                />
                <label htmlFor="random-category">Random category</label>
              </div>

              <div
                className={`chip-grid ${randomCategory ? "is-disabled" : ""}`}
                role="group"
                aria-labelledby="category-label"
              >
                {categories.map((item) => {
                  const active = selected.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`chip ${active ? "active" : ""}`}
                      aria-pressed={active}
                      disabled={randomCategory}
                      onClick={() => toggleCategory(item)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              {errors.selectedCategories && (
                <small role="alert">{errors.selectedCategories.message}</small>
              )}

              {categoryHint && <small>{categoryHint}</small>}

              {previewCategory && (
                <div className="category-preview" aria-label="Example words">
                  <span className="category-preview-title">
                    EXAMPLES · {previewCategory.toUpperCase()}
                  </span>
                  <ul className="category-preview-list">
                    {previewWords.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  <small>Just examples, not necessarily the secret word.</small>
                </div>
              )}
            </div>
          </div>

          {/* ===== Players ===== */}
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
                    deps: ["spies"],
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

          {/* ===== Spies ===== */}
          <div className="setting-card">
            <div className="setting-icon" aria-hidden="true">
              ◈
            </div>

            <div className="setting-content">
              <label id="spies-label">Number of Spies</label>

              <div
                className="time-options"
                role="group"
                aria-labelledby="spies-label"
              >
                {spyOptions.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`time-button ${spies === n ? "active" : ""}`}
                    aria-pressed={spies === n}
                    onClick={() =>
                      setValue("spies", n, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>

              <small role={errors.spies ? "alert" : undefined}>
                {errors.spies
                  ? errors.spies.message
                  : playersValid
                  ? `Up to ${maxSpies} for ${playersNumber} players`
                  : "Enter the number of players first"}
              </small>
            </div>
          </div>

          {/* ===== Duration ===== */}
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
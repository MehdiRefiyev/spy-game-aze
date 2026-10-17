import { Navigate, useLocation, useNavigate } from "react-router";
import "../../App.css"; // shared theme (game-page, corner, start-button ...)
import "./Finish.css";

function Finish() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // opened directly by URL (no finished game) -> back to Home
  if ((state as { finished?: boolean } | null)?.finished !== true) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="game-page finish-page">
      <div className="background-glow" />
      <div className="corner corner-top" />
      <div className="corner corner-bottom" />

      <section className="game-container finish-container">
        <span className="top-secret">MISSION COMPLETE</span>
        <h1 className="finish-title">TIME IS UP</h1>

        <button
          type="button"
          className="start-button"
          // replace: Back button can't return to the finished screen
          onClick={() => navigate("/", { replace: true })}
        >
          <span>NEW GAME</span>
          <span className="start-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </section>
    </main>
  );
}

export default Finish;
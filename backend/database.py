"""
SugarSense — SQLite Persistence Layer
Stores shift records and per-prediction data for shift comparison analytics.
Uses SQLAlchemy Core (no ORM) for lightweight edge-device compatibility.
"""
import os
import json
from datetime import datetime
from typing import Optional
import sqlalchemy as sa

_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sugarsense.db")
_engine  = sa.create_engine(f"sqlite:///{_DB_PATH}", connect_args={"check_same_thread": False})

metadata = sa.MetaData()

shifts_table = sa.Table(
    "shifts", metadata,
    sa.Column("id",          sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("name",        sa.String(120), nullable=False),
    sa.Column("started_at",  sa.String(32),  nullable=False),
    sa.Column("ended_at",    sa.String(32),  nullable=True),
    sa.Column("total_samples",   sa.Integer, default=0),
    sa.Column("avg_pol",         sa.Float,   default=0),
    sa.Column("total_alerts",    sa.Integer, default=0),
    sa.Column("total_anomalies", sa.Integer, default=0),
    sa.Column("avg_inference_ms",sa.Float,   default=0),
    sa.Column("threshold",       sa.Float,   default=13.0),
)

predictions_table = sa.Table(
    "predictions", metadata,
    sa.Column("id",           sa.Integer, primary_key=True, autoincrement=True),
    sa.Column("shift_id",     sa.Integer, sa.ForeignKey("shifts.id"), nullable=False),
    sa.Column("timestamp",    sa.Float,   nullable=False),
    sa.Column("predicted_pol",sa.Float,   nullable=False),
    sa.Column("actual_pol",   sa.Float,   nullable=True),
    sa.Column("brix",         sa.Float,   nullable=True),
    sa.Column("fibre",        sa.Float,   nullable=True),
    sa.Column("purity",       sa.Float,   nullable=True),
    sa.Column("inference_ms", sa.Float,   nullable=True),
    sa.Column("alert",        sa.Boolean, default=False),
    sa.Column("anomaly",      sa.Boolean, default=False),
    sa.Column("confidence",   sa.Float,   nullable=True),
)


def create_tables():
    """Create database tables if they don't exist."""
    metadata.create_all(_engine)
    print(f"[DB] SQLite database ready at {_DB_PATH}")


# ── Shift CRUD ────────────────────────────────────────────────────────────────

def create_shift(name: str, threshold: float = 13.0) -> int:
    """Create a new shift record and return its ID."""
    with _engine.begin() as conn:
        result = conn.execute(shifts_table.insert().values(
            name=name,
            started_at=datetime.utcnow().isoformat(),
            threshold=threshold,
        ))
        return result.inserted_primary_key[0]


def close_shift(shift_id: int, summary: dict):
    """Update a shift record with final stats when the session ends."""
    with _engine.begin() as conn:
        conn.execute(shifts_table.update()
            .where(shifts_table.c.id == shift_id)
            .values(
                ended_at=datetime.utcnow().isoformat(),
                total_samples=summary.get("total_samples", 0),
                avg_pol=summary.get("avg_pol", 0),
                total_alerts=summary.get("total_alerts", 0),
                total_anomalies=summary.get("total_anomalies", 0),
                avg_inference_ms=summary.get("avg_inference_ms", 0),
            ))


def list_shifts() -> list[dict]:
    """Return all stored shifts as a list of dicts, newest first."""
    with _engine.connect() as conn:
        rows = conn.execute(shifts_table.select().order_by(shifts_table.c.id.desc())).fetchall()
        return [dict(r._mapping) for r in rows]


def get_shift(shift_id: int) -> Optional[dict]:
    """Return a single shift record or None."""
    with _engine.connect() as conn:
        row = conn.execute(shifts_table.select().where(shifts_table.c.id == shift_id)).fetchone()
        return dict(row._mapping) if row else None


def delete_shift(shift_id: int):
    """Delete a shift and all its predictions."""
    with _engine.begin() as conn:
        conn.execute(predictions_table.delete().where(predictions_table.c.shift_id == shift_id))
        conn.execute(shifts_table.delete().where(shifts_table.c.id == shift_id))


# ── Prediction Persistence ────────────────────────────────────────────────────

def save_prediction(shift_id: int, payload: dict):
    """Persist a single prediction tick to the predictions table."""
    if shift_id is None:
        return
    with _engine.begin() as conn:
        conn.execute(predictions_table.insert().values(
            shift_id=shift_id,
            timestamp=payload.get("timestamp", 0),
            predicted_pol=payload.get("predicted_pol", 0),
            actual_pol=payload.get("actual_pol"),
            brix=payload.get("brix"),
            fibre=payload.get("fibre"),
            purity=payload.get("purity"),
            inference_ms=payload.get("inference_ms"),
            alert=payload.get("alert", False),
            anomaly=payload.get("anomaly", False),
            confidence=payload.get("confidence"),
        ))


def get_shift_predictions(shift_id: int) -> list[dict]:
    """Return all predictions for a shift, in chronological order."""
    with _engine.connect() as conn:
        rows = conn.execute(
            predictions_table.select()
            .where(predictions_table.c.shift_id == shift_id)
            .order_by(predictions_table.c.timestamp)
        ).fetchall()
        return [dict(r._mapping) for r in rows]

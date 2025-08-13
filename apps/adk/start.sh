if [ -d .venv ]; then
  source .venv/bin/activate
else
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
fi

# Allow overriding the port via PORT env var (default 8000)
PORT="${PORT:-8000}"
uvicorn main:app --host 0.0.0.0 --port "$PORT"

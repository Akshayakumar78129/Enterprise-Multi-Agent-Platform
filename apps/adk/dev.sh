if [ -d .venv ]; then
  source .venv/bin/activate
else
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  python3 setup_db.py
  cp orchestration_agent/database/inventory.db ../web/Inventory/database/inventory.db
  cp orchestration_agent/database/sales_agent.db ../web/Sales/database/sales_agent.db
  cp orchestration_agent/database/financial_agent.db ../web/Finance/database/financial_agent.db
  cp orchestration_agent/database/customers.db ../web/Customer/database/customers.db
fi
uvicorn main:app --host 0.0.0.0 --reload --port 8000

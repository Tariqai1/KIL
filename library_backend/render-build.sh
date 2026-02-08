#!/usr/bin/env bash

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# --- YAHAN BADLAV KAREIN ---
# Run alembic before the app starts
alembic upgrade head
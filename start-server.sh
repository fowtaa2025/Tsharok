#!/bin/bash

echo "============================================"
echo "Tsharok - Starting Development Server"
echo "============================================"
echo ""

cd public

echo "Starting PHP built-in server on http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""
echo "Available pages:"
echo "- http://localhost:8000/index.html (Homepage)"
echo "- http://localhost:8000/login.html (Login)"
echo "- http://localhost:8000/register.html (Register)"
echo ""

php -S localhost:8000

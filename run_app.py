import os
import sys
import time
import threading
import subprocess
import webbrowser
from pathlib import Path

def start_backend():
    """Start Flask backend server"""
    try:
        backend_path = Path(__file__).parent / "backend"
        os.chdir(backend_path)
        
        print("🚀 Starting Backend Server...")
        print("📍 Backend running on: http://127.0.0.1:5000")
        
        # Start Flask app
        subprocess.run([sys.executable, "app.py"], check=True)
        
    except Exception as e:
        print(f"❌ Backend Error: {e}")

def start_frontend():
    """Start frontend HTTP server"""
    try:
        frontend_path = Path(__file__).parent / "frontend"
        os.chdir(frontend_path)
        
        print("🌐 Starting Frontend Server...")
        print("📍 Frontend running on: http://localhost:8000")
        
        # Start HTTP server
        subprocess.run([sys.executable, "-m", "http.server", "8000"], check=True)
        
    except Exception as e:
        print(f"❌ Frontend Error: {e}")

def main():
    """Main application runner"""
    print("=" * 60)
    print("🔥 PDF to JSON Dataset Builder - Professional Edition")
    print("=" * 60)
    print()
    
    try:
        # Start backend in separate thread
        backend_thread = threading.Thread(target=start_backend, daemon=True)
        backend_thread.start()
        
        # Wait for backend to start
        time.sleep(3)
        
        # Start frontend in separate thread
        frontend_thread = threading.Thread(target=start_frontend, daemon=True)
        frontend_thread.start()
        
        # Wait for frontend to start
        time.sleep(2)
        
        # Open browser
        print("🌟 Opening application in browser...")
        webbrowser.open("http://localhost:8000")
        
        print()
        print("✅ Application is running!")
        print("📱 Frontend: http://localhost:8000")
        print("🔧 Backend API: http://127.0.0.1:5000")
        print()
        print("Press Ctrl+C to stop the application")
        print("=" * 60)
        
        # Keep main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Shutting down application...")
            print("👋 Goodbye!")
            
    except Exception as e:
        print(f"❌ Application Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
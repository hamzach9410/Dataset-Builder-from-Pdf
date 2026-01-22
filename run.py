import subprocess
import sys
import os
import time
import webbrowser
from threading import Thread

def run_backend():
    os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))
    subprocess.run([sys.executable, 'app.py'])

def run_frontend():
    os.chdir(os.path.join(os.path.dirname(__file__), 'frontend'))
    subprocess.run([sys.executable, '-m', 'http.server', '8000'])

if __name__ == '__main__':
    print("Starting PDF to JSON Dataset Builder...")
    
    backend_thread = Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()
    
    time.sleep(3)
    
    frontend_thread = Thread(target=run_frontend)
    frontend_thread.daemon = True
    frontend_thread.start()
    
    time.sleep(2)
    webbrowser.open('http://localhost:8000')
    
    print("Backend: http://127.0.0.1:5000")
    print("Frontend: http://localhost:8000")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
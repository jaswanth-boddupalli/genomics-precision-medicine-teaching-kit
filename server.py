"""
server.py - High performance local web server for the Genomics to Precision Medicine Atlas
Serves on http://localhost:8000 with CORS enabled and proper MIME types.
"""

import http.server
import socketserver
import os
import sys

# Ensure UTF-8 output on Windows consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class GenomicsAtlasHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        # Ensure accurate MIME types
        if path.endswith(".js"):
            return "application/javascript; charset=utf-8"
        elif path.endswith(".css"):
            return "text/css; charset=utf-8"
        elif path.endswith(".json"):
            return "application/json; charset=utf-8"
        elif path.endswith(".md"):
            return "text/markdown; charset=utf-8"
        elif path.endswith(".html"):
            return "text/html; charset=utf-8"
        return super().guess_type(path)

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def run():
    os.chdir(DIRECTORY)
    server_address = ('127.0.0.1', PORT)
    with ReusableTCPServer(server_address, GenomicsAtlasHTTPRequestHandler) as httpd:
        print("=" * 72)
        print("[Atlas] The Complete Genomics to Precision Medicine Knowledge Graph Atlas")
        print("=" * 72)
        print(f" Serving directory : {DIRECTORY}")
        print(f" Local URL         : http://localhost:{PORT}")
        print(f" Network URL       : http://127.0.0.1:{PORT}")
        print(" Press Ctrl+C to terminate.")
        print("=" * 72)
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer shutting down gracefully.")

if __name__ == '__main__':
    run()

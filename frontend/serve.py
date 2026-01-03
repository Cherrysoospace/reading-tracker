#!/usr/bin/env python3
"""
Simple HTTP server for serving the frontend.
Run this from the frontend directory.
"""

import http.server
import socketserver
import os

PORT = 5500
DIRECTORY = "."

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        # Fix MIME types for JavaScript modules
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"✨ Servidor frontend iniciado en http://localhost:{PORT}")
        print(f"📁 Sirviendo archivos desde: {os.getcwd()}")
        print(f"🌐 Abre en tu navegador: http://localhost:{PORT}/index.html")
        print(f"⌨️  Presiona CTRL+C para detener el servidor\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✨ Servidor detenido. ¡Hasta pronto!")

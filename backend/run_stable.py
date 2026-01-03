"""
Script para iniciar el servidor backend sin auto-reload
Útil cuando el auto-reload causa problemas
"""
import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Iniciando Reading Tracker Backend")
    print("⚠️  Auto-reload DESACTIVADO para evitar recargas infinitas")
    print("📍 URL: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("=" * 60)
    print()
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # DESACTIVAR reload
        log_level="info",
        access_log=True
    )

# 📚 Reading Tracker - Frontend

Frontend del Reading Tracker con estilo Kawaii, construido con JavaScript Vanilla, Bootstrap 5 y Chart.js.

## 🚀 Cómo Ejecutar

### Opción 1: Python HTTP Server (Recomendado)

```bash
cd frontend
python serve.py
```

Luego abre en tu navegador: http://localhost:5500

### Opción 2: Live Server (VS Code Extension)

1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `index.html` → "Open with Live Server"
3. Se abrirá automáticamente en tu navegador

### Opción 3: Node.js http-server

```bash
npm install -g http-server
cd frontend
http-server -p 5500
```

## ⚠️ IMPORTANTE

**NO abras el archivo HTML directamente (file://)**

Los módulos ES6 NO funcionarán si abres el archivo con:
- Doble click en index.html
- File → Open en el navegador
- `file:///C:/...` en la barra de direcciones

❌ **Incorrecto:** `file:///C:/Users/.../index.html`
✅ **Correcto:** `http://localhost:5500/index.html`

## 🔧 Requisitos Previos

1. **Backend corriendo:**
   ```bash
   cd backend
   python -m src.main
   ```
   El backend debe estar en: http://localhost:8000

2. **Servidor frontend:**
   - Usar cualquiera de las opciones anteriores
   - NO usar file:// protocol

## 📁 Estructura del Proyecto

```
frontend/
├── index.html          # Dashboard principal
├── books.html          # Gestión de libros
├── sessions.html       # Registro de sesiones
├── stats.html          # Estadísticas y gráficas
├── serve.py           # Servidor HTTP simple
├── css/
│   ├── variables.css   # Variables CSS Kawaii
│   ├── style.css      # Estilos personalizados
│   └── components.css
├── js/
│   ├── main.js        # Punto de entrada
│   ├── api/           # Módulos de API
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Lógica de cada página
│   └── utils/         # Utilidades
└── assets/            # Recursos estáticos

```

## 🎨 Características

- ✨ Estilo Kawaii con colores pastel
- 📊 Gráficas interactivas con Chart.js
- 📱 Responsive design con Bootstrap 5
- 🚀 Módulos ES6 modernos
- ⚡ Tablas interactivas con Tabulator

## 🐛 Solución de Problemas

### Error: "Failed to fetch dynamically imported module"

**Causa:** Estás abriendo el archivo con `file://` protocol

**Solución:** Usa un servidor HTTP (ve las opciones arriba)

### Error: "CORS policy" o "Failed to fetch"

**Causa:** El backend no está corriendo o CORS no está configurado

**Solución:**
1. Verifica que el backend esté corriendo: http://localhost:8000/health
2. El backend debe permitir requests desde tu puerto (5500, 8080, etc.)

### Error: "Cannot find module"

**Causa:** Rutas de importación incorrectas

**Solución:** Verifica que todas las rutas en los imports sean relativas y correctas

### La página se carga infinitamente

**Posibles causas:**
1. Backend no está corriendo
2. Error de CORS
3. Error en el código JavaScript

**Solución:**
1. Abre la consola del navegador (F12)
2. Revisa los errores en la pestaña Console
3. Ignora errores de `chrome-extension://` (son de extensiones del navegador)
4. Busca errores reales de tu código

## 📝 Desarrollo

### Agregar una nueva página

1. Crear archivo HTML en `frontend/`
2. Crear archivo JS en `frontend/js/pages/`
3. Agregar ruta en `frontend/js/main.js`:
   ```javascript
   const PAGE_ROUTES = {
       '/nueva-pagina.html': initNuevaPagina,
       // ...
   };
   ```

### Agregar una nueva API endpoint

1. Crear función en el módulo apropiado en `frontend/js/api/`
2. Usar `fetchData()` de `api.js` para hacer la petición
3. Manejar errores con try/catch

## 🎯 URLs Importantes

- **Frontend:** http://localhost:5500
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## 💡 Tips

1. **Usa las DevTools:** F12 para abrir la consola y ver errores
2. **Hard Refresh:** Ctrl+Shift+R para limpiar cache
3. **Network Tab:** Para ver peticiones HTTP y sus respuestas
4. **Console Tab:** Para ver logs y errores de JavaScript

¡Disfruta programando! ✨📚💕

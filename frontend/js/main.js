/**
 * Main Application Entry Point
 * Enrutador básico que inicializa los módulos según la página actual
 */

// Importar funciones de inicialización de cada página
import { initDashboard } from './pages/dashboard.js';
import { initBooksPage } from './pages/books.js';
import { initSessionsPage } from './pages/sessions.js';
import { initStatsPage } from './pages/stats.js';

// Flag para prevenir múltiples inicializaciones
let isInitialized = false;

/**
 * Mapa de rutas a funciones de inicialización
 * Asocia cada página HTML con su función de inicialización correspondiente
 */
const PAGE_ROUTES = {
    '/': initDashboard,
    '/index.html': initDashboard,
    '/books.html': initBooksPage,
    '/sessions.html': initSessionsPage,
    '/stats.html': initStatsPage
};

/**
 * Obtiene el nombre de la página actual desde la URL
 * @returns {string} Ruta de la página actual
 */
function getCurrentPage() {
    const path = window.location.pathname;
    
    // Si la ruta termina con /, asumimos que es index.html
    if (path.endsWith('/')) {
        return '/';
    }
    
    // Extraer solo el nombre del archivo si hay una ruta completa
    const fileName = path.split('/').pop();
    
    // Si no hay nombre de archivo o es vacío, es la raíz
    if (!fileName || fileName === '') {
        return '/';
    }
    
    return '/' + fileName;
}

/**
 * Resalta el enlace activo en la barra de navegación
 * Agrega la clase 'active' al enlace correspondiente a la página actual
 */
function highlightActiveNavLink() {
    const currentPage = getCurrentPage();
    
    // Obtener todos los enlaces del navbar
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        // Remover clase active de todos los enlaces
        link.classList.remove('active');
        
        // Obtener el href del enlace
        const href = link.getAttribute('href');
        
        // Comparar con la página actual
        if (href === currentPage || 
            (currentPage === '/' && (href === 'index.html' || href === '/')) ||
            (currentPage === '/index.html' && (href === '/' || href === 'index.html'))) {
            link.classList.add('active');
            
            // Agregar aria-current para accesibilidad
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
    
    console.log(`🎯 Página activa: ${currentPage}`);
}

/**
 * Inicializa la aplicación según la página actual
 * Detecta la página y ejecuta su función de inicialización correspondiente
 */
function initializeApp() {
    // Prevenir múltiples inicializaciones
    if (isInitialized) {
        console.warn('⚠️ App ya inicializada, ignorando reinicialización');
        return;
    }
    
    const currentPage = getCurrentPage();
    
    console.log('%c✨ Reading Tracker Kawaii ✨', 'font-size: 20px; color: #ff99cc; font-weight: bold;');
    console.log(`📖 Inicializando página: ${currentPage}`);
    
    // Buscar la función de inicialización correspondiente
    const initFunction = PAGE_ROUTES[currentPage];
    
    if (initFunction) {
        try {
            // Ejecutar la función de inicialización
            initFunction();
            isInitialized = true; // Marcar como inicializado
            console.log(`✅ ${currentPage} inicializada correctamente`);
        } catch (error) {
            console.error(`❌ Error al inicializar ${currentPage}:`, error);
            // No mostrar error de UI aquí para evitar spam
            console.warn('Si ves errores de chrome-extension://, son de extensiones del navegador y puedes ignorarlos');
        }
    } else {
        console.warn(`⚠️ Ruta no reconocida: ${currentPage}`);
        console.log('📋 Rutas disponibles:', Object.keys(PAGE_ROUTES));
    }
    
    // Resaltar el enlace activo en el navbar
    highlightActiveNavLink();
    
    // Log de éxito final
    console.log('%c🎉 ¡Aplicación iniciada con éxito! 🎉', 'font-size: 16px; color: #66ccff; font-weight: bold;');
}

/**
 * Muestra una notificación de error al usuario
 * @param {string} message - Mensaje de error a mostrar
 */
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    notification.style.cssText = 'z-index: 9999; border-radius: 15px; border: 3px solid white; box-shadow: 5px 5px 0px rgba(255, 204, 229, 1); min-width: 300px; max-width: 500px;';
    notification.innerHTML = `
        <strong>😢 ¡Oh no!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Configura listeners globales para la aplicación
 */
function setupGlobalListeners() {
    // Listener para actualizar el dashboard cuando se modifiquen sesiones
    window.addEventListener('sessionsUpdated', () => {
        console.log('📊 Evento sessionsUpdated detectado');
        
        // Si estamos en el dashboard, recargar los datos (no toda la página)
        const currentPage = getCurrentPage();
        if (currentPage === '/' || currentPage === '/index.html') {
            console.log('🔄 Recargando dashboard...');
            // NO reinicializar toda la app, solo recargar dashboard
            if (typeof initDashboard === 'function') {
                initDashboard();
            }
        }
    });
    
    // REMOVIDO: listener de popstate que causaba recargas
    // window.addEventListener('popstate', () => { ... });
    
    console.log('🎧 Listeners globales configurados');
}

/**
 * Función de inicialización principal
 * Se ejecuta cuando el DOM está completamente cargado
 */
function main() {
    // Suprimir errores de extensiones de Chrome que no afectan la funcionalidad
    window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('chrome-extension://')) {
            console.warn('⚠️ Error de extensión de Chrome detectado (ignorado):', event.message);
            event.preventDefault();
            return;
        }
    });
    
    // Configurar listeners globales
    setupGlobalListeners();
    
    // Inicializar la aplicación
    initializeApp();
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', main);

// Exportar funciones útiles para uso global si es necesario
export { initializeApp, getCurrentPage, highlightActiveNavLink };

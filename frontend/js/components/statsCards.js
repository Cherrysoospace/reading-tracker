/**
 * Stats Cards Component
 * Genera tarjetas de métricas para el dashboard con estética Kawaii
 */

/**
 * Convierte minutos totales a formato legible (horas y minutos)
 * @param {number} totalMinutes - Total de minutos
 * @returns {string} Formato "Xh Ym" o "X minutos"
 */
function formatReadingTime(totalMinutes) {
    if (!totalMinutes || totalMinutes === 0) {
        return '0 minutos';
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
        return `${minutes} min`;
    } else if (minutes === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${minutes}m`;
    }
}

/**
 * Renderiza las tarjetas de estadísticas en el dashboard
 * 
 * @param {string} containerId - ID del contenedor donde se insertarán las tarjetas
 * @param {Object} statsData - Datos de estadísticas desde /stats/summary
 * @param {number} statsData.total_minutes_read - Total de minutos leídos
 * @param {Object|null} statsData.most_read_book - Libro más leído {book_id, title, author, total_minutes}
 * @param {number} statsData.books_finished - Total de libros terminados
 * @param {Object} streakData - Datos de rachas desde /stats/streaks
 * @param {number} streakData.current_streak - Racha actual de días consecutivos
 * @param {number} streakData.max_streak - Racha máxima alcanzada
 */
export function renderStatsCards(containerId, statsData, streakData) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Contenedor con ID "${containerId}" no encontrado`);
        return;
    }
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Extraer datos con valores por defecto
    const totalMinutes = statsData?.total_minutes_read || 0;
    const currentStreak = streakData?.current_streak || 0;
    const mostReadBook = statsData?.most_read_book || null;
    const booksFinished = statsData?.books_finished || 0;
    
    // Generar HTML de las tarjetas usando template literals
    const cardsHTML = `
        <div class="row g-4">
            <!-- Tarjeta 1: Tiempo Total de Lectura -->
            <div class="col-md-6 col-lg-3">
                <div class="card text-center p-4" style="background-color: var(--kawaii-pink);">
                    <div class="card-body">
                        <div class="display-4 mb-2">📖</div>
                        <h5 class="card-title">Tiempo Total</h5>
                        <p class="display-6 fw-bold mb-0">${formatReadingTime(totalMinutes)}</p>
                        <small class="text-muted">${totalMinutes} minutos</small>
                    </div>
                </div>
            </div>
            
            <!-- Tarjeta 2: Racha Actual -->
            <div class="col-md-6 col-lg-3">
                <div class="card text-center p-4" style="background-color: var(--kawaii-blue);">
                    <div class="card-body">
                        <div class="display-4 mb-2">🔥</div>
                        <h5 class="card-title">Racha Actual</h5>
                        <p class="display-6 fw-bold mb-0">${currentStreak}</p>
                        <small class="text-muted">${currentStreak === 1 ? 'día' : 'días'} consecutivos</small>
                    </div>
                </div>
            </div>
            
            <!-- Tarjeta 3: Libro Más Leído -->
            <div class="col-md-6 col-lg-3">
                <div class="card text-center p-4" style="background-color: var(--kawaii-purple);">
                    <div class="card-body">
                        <div class="display-4 mb-2">⭐</div>
                        <h5 class="card-title">Libro Más Leído</h5>
                        ${mostReadBook ? `
                            <p class="fw-bold mb-1" style="font-size: 0.95rem;">${mostReadBook.title}</p>
                            <small class="text-muted d-block mb-1">${mostReadBook.author || 'Autor desconocido'}</small>
                            <small class="text-muted">${formatReadingTime(mostReadBook.total_minutes)}</small>
                        ` : `
                            <p class="text-muted mb-0">Sin datos aún</p>
                            <small class="text-muted">¡Empieza a leer! 📚</small>
                        `}
                    </div>
                </div>
            </div>
            
            <!-- Tarjeta 4: Libros Terminados (Año Actual) -->
            <div class="col-md-6 col-lg-3">
                <div class="card text-center p-4" style="background-color: var(--kawaii-yellow);">
                    <div class="card-body">
                        <div class="display-4 mb-2">🎉</div>
                        <h5 class="card-title">Libros Terminados</h5>
                        <p class="display-6 fw-bold mb-0">${booksFinished}</p>
                        <small class="text-muted">en total</small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insertar las tarjetas en el contenedor
    container.innerHTML = cardsHTML;
}

/**
 * Renderiza una tarjeta individual de estadística
 * Función auxiliar para crear tarjetas personalizadas
 * 
 * @param {Object} config - Configuración de la tarjeta
 * @param {string} config.emoji - Emoji o icono a mostrar
 * @param {string} config.title - Título de la tarjeta
 * @param {string} config.value - Valor principal
 * @param {string} config.subtitle - Subtítulo o descripción
 * @param {string} config.backgroundColor - Color de fondo (variable CSS)
 * @returns {string} HTML de la tarjeta
 */
export function createStatCard(config) {
    const { emoji, title, value, subtitle, backgroundColor } = config;
    
    return `
        <div class="card text-center p-4" style="background-color: ${backgroundColor};">
            <div class="card-body">
                <div class="display-4 mb-2">${emoji}</div>
                <h5 class="card-title">${title}</h5>
                <p class="display-6 fw-bold mb-0">${value}</p>
                ${subtitle ? `<small class="text-muted">${subtitle}</small>` : ''}
            </div>
        </div>
    `;
}

// Debug script for wrapped page
// Run this in the console to diagnose issues

console.log('=== WRAPPED PAGE DIAGNOSTICS ===\n');

// 1. Check if elements exist
console.log('1. HTML ELEMENTS CHECK:');
const elements = {
    'wrapped-container': document.getElementById('wrapped-container'),
    'loading-screen': document.getElementById('loading-screen'),
    'error-state': document.getElementById('error-state'),
    'cards-wrapper': document.getElementById('cards-wrapper'),
    'year-selector': document.getElementById('year-selector'),
    'wrapped-year': document.getElementById('wrapped-year'),
    'total-hours': document.getElementById('total-hours'),
    'total-minutes-text': document.getElementById('total-minutes-text'),
    'total-days': document.getElementById('total-days'),
    'average-per-day-text': document.getElementById('average-per-day-text'),
    'longest-streak': document.getElementById('longest-streak'),
    'most-read-book-title': document.getElementById('most-read-book-title'),
    'biggest-day-date': document.getElementById('biggest-day-date'),
    'favorite-author-name': document.getElementById('favorite-author-name'),
    'favorite-day': document.getElementById('favorite-day'),
    'books-finished': document.getElementById('books-finished'),
    'personality-type': document.getElementById('personality-type')
};

Object.keys(elements).forEach(key => {
    console.log(`  ${key}: ${elements[key] ? '✓ EXISTS' : '✗ MISSING'}`);
});

// 2. Check visibility
console.log('\n2. VISIBILITY CHECK:');
console.log('  wrapped-container classes:', elements['wrapped-container']?.className);
console.log('  wrapped-container hidden?:', elements['wrapped-container']?.classList.contains('hidden'));
console.log('  loading-screen hidden?:', elements['loading-screen']?.classList.contains('hidden'));

// 3. Check computed styles
console.log('\n3. COMPUTED STYLES:');
if (elements['wrapped-container']) {
    const styles = window.getComputedStyle(elements['wrapped-container']);
    console.log('  display:', styles.display);
    console.log('  visibility:', styles.visibility);
    console.log('  opacity:', styles.opacity);
}

// 4. Check cards
console.log('\n4. CARDS CHECK:');
const cards = document.querySelectorAll('.wrapped-card');
console.log('  Total cards found:', cards.length);
console.log('  Expected cards: 11');

// 5. Try to manually show wrapped
console.log('\n5. MANUAL SHOW TEST:');
console.log('  Run: document.getElementById("wrapped-container").classList.remove("hidden")');
console.log('  Run: document.getElementById("loading-screen").classList.add("hidden")');

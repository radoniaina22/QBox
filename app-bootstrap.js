'use strict';
if (new URLSearchParams(location.search).get('backend') === 'postgres') {
    document.documentElement.classList.add('postgres-mode');
}

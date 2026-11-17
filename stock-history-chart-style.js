'use strict';

const stockHistoryChartStyle = (() => {
    const ticks = { color: '#64748b', font: { size: 11 }, padding: 8 };
    const tooltip = {
        backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#e2e8f0',
        padding: 12, cornerRadius: 10, displayColors: true
    };

    function options(type, reducedMotion) {
        const horizontal = type === 'bar';
        return {
            responsive: true, maintainAspectRatio: false,
            animation: reducedMotion ? false : { duration: 500 },
            ...(horizontal ? { indexAxis: 'y' } : {}),
            interaction: { mode: 'nearest', intersect: false },
            plugins: {
                legend: horizontal ? { display: false } : {
                    position: 'bottom',
                    labels: { color: '#475569', usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 16, font: { size: 11 } }
                },
                tooltip
            },
            scales: {
                x: {
                    ...(horizontal ? { beginAtZero: true } : {}),
                    grid: { display: horizontal, color: '#e2e8f0', drawBorder: false },
                    ticks: { ...ticks, ...(horizontal ? {} : { maxTicksLimit: 3, maxRotation: 0 }) },
                    border: { display: false }
                },
                y: {
                    ...(!horizontal ? { beginAtZero: true } : {}),
                    grid: { display: !horizontal, color: '#e2e8f0', drawBorder: false },
                    ticks, border: { display: false }
                }
            }
        };
    }

    function sizeBars(container, count) {
        container.style.height = `${Math.max(260, count * 42 + 40)}px`;
    }

    return { options, sizeBars };
})();

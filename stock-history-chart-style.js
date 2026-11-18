'use strict';

const stockHistoryChartStyle = (() => {
    const ticks = {
        color: '#64748b',
        font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
        padding: 8
    };
    const tooltip = {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(148, 163, 184, 0.25)',
        borderWidth: 1,
        titleFont: { family: "'Inter', sans-serif", size: 12, weight: '700' },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 5
    };

    function options(type, reducedMotion) {
        const horizontal = type === 'bar';
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: reducedMotion ? false : { duration: 480, easing: 'easeOutQuart' },
            ...(horizontal ? { indexAxis: 'y' } : {}),
            interaction: { mode: 'nearest', intersect: false },
            plugins: {
                legend: horizontal ? { display: false } : {
                    position: 'bottom',
                    labels: {
                        color: '#475569',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 16,
                        font: { family: "'Inter', sans-serif", size: 11, weight: '600' }
                    }
                },
                tooltip
            },
            scales: {
                x: {
                    ...(horizontal ? { beginAtZero: true } : {}),
                    grid: { display: horizontal, color: '#f1f5f9', drawBorder: false },
                    ticks: { ...ticks, ...(horizontal ? {} : { maxTicksLimit: 3, maxRotation: 0 }) },
                    border: { display: false }
                },
                y: {
                    ...(!horizontal ? { beginAtZero: true } : {}),
                    grid: { display: !horizontal, color: '#f1f5f9', drawBorder: false },
                    ticks,
                    border: { display: false }
                }
            }
        };
    }

    function sizeBars(container, count) {
        container.style.height = `${Math.max(260, count * 42 + 40)}px`;
    }

    return { options, sizeBars };
})();
'use strict';

// Courbe « Évolution du stock disponible » de l'historique des stocks (Chart.js).
// Un seul intrant à la fois, en paliers (le stock reste constant entre deux mouvements),
// points colorés selon le sens du mouvement et seuil minimal en pointillé.
// Les couleurs viennent des variables du thème (--qb-*), le mode sombre suit au rendu.
const stockHistoryChartStyle = (() => {
    function css(name, fallback) {
        try {
            const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
            return value || fallback;
        } catch {
            return fallback;
        }
    }

    function palette() {
        return {
            line: css('--qb-primary', '#1d58c9'),
            up: css('--qb-success', '#059669'),
            down: css('--qb-danger', '#e11d48'),
            flat: css('--qb-faint', '#93a1b6'),
            threshold: css('--qb-accent', '#f59e0b'),
            grid: css('--qb-line-soft', '#ebf0f6'),
            text: css('--qb-muted', '#5f6f88'),
            surface: css('--qb-surface', '#ffffff')
        };
    }

    function alpha(color, opacity) {
        const match = /^#([0-9a-f]{6})$/i.exec(color);
        if (!match) return 'transparent';
        const value = parseInt(match[1], 16);
        return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
    }

    const format = value => Number(value).toLocaleString('fr-FR');

    // values : disponible après chaque point ; moves : 1 entrée, -1 sortie, 0 sans variation du stock.
    function evolutionDatasets(values, moves, threshold) {
        const colors = palette();
        const pointColor = moves.map(move => move > 0 ? colors.up : move < 0 ? colors.down : colors.flat);
        const dense = values.length > 60;
        const datasets = [{
            label: 'Disponible',
            data: values,
            stepped: true,
            borderColor: colors.line,
            borderWidth: 2.5,
            fill: 'origin',
            backgroundColor: context => {
                const area = context.chart?.chartArea;
                if (!area) return alpha(colors.line, .12);
                const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                gradient.addColorStop(0, alpha(colors.line, .22));
                gradient.addColorStop(1, alpha(colors.line, .02));
                return gradient;
            },
            pointBackgroundColor: pointColor,
            pointBorderColor: colors.surface,
            pointBorderWidth: dense ? 1 : 2,
            pointRadius: dense ? 2.5 : 4.5,
            pointHoverRadius: 7,
            pointHoverBorderWidth: 2
        }];
        if (threshold !== null && threshold > 0) datasets.push({
            label: 'Seuil minimal',
            data: values.map(() => threshold),
            borderColor: colors.threshold,
            borderWidth: 1.5,
            borderDash: [6, 5],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false
        });
        return datasets;
    }

    // meta[i] : { title, lines[] } affichés dans l'infobulle du point i.
    function evolutionOptions(meta, unit, reducedMotion) {
        const colors = palette();
        const suffix = unit ? ` ${unit}` : '';
        return {
            responsive: true, maintainAspectRatio: false,
            animation: reducedMotion ? false : { duration: 450 },
            interaction: { mode: 'index', intersect: false },
            layout: { padding: { top: 6, right: 6 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#0f172a', titleColor: '#fff', bodyColor: '#e2e8f0', footerColor: '#cbd5e1',
                    padding: 12, cornerRadius: 10, displayColors: false,
                    titleFont: { weight: '700' }, footerFont: { weight: '400' },
                    callbacks: {
                        title: items => meta[items[0]?.dataIndex]?.title || '',
                        label: item => item.datasetIndex === 0
                            ? `Disponible : ${format(item.parsed.y)}${suffix}`
                            : `Seuil minimal : ${format(item.parsed.y)}${suffix}`,
                        footer: items => meta[items[0]?.dataIndex]?.lines || []
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }, border: { display: false },
                    ticks: { color: colors.text, font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8, padding: 6 }
                },
                y: {
                    beginAtZero: true, grace: '8%',
                    grid: { color: colors.grid }, border: { display: false },
                    ticks: { color: colors.text, font: { size: 11 }, padding: 8, precision: 0, maxTicksLimit: 6, callback: value => format(value) }
                }
            }
        };
    }

    return { evolutionDatasets, evolutionOptions, palette };
})();

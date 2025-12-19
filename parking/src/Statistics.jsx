import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import Papa from 'papaparse';
import * as echarts from 'echarts';
import Header from './Header';
import { useTheme } from './ThemeContext';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwLNDbg8KjlVHsZWj9JUnO_OBIyZaRgZ4gZ8_Gbyly2J3f6rlCW6lDHAihwbuLhxWbBkNMI1wdWRAq/pub?gid=411529798&single=true&output=csv';

const PALETTES = {
    neon: { gd: '#05ffa1', uni: '#01beff' },
    classic: { gd: '#3b82f6', uni: '#f59e0b' },
    cyberpunk: { gd: '#00d9ff', uni: '#ff00cc' },
    modern: { gd: '#10b981', uni: '#6366f1' }
};

const Statistics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [palette, setPalette] = useState('neon');
    const [showSymbols, setShowSymbols] = useState(false);
    const { isLight } = useTheme();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${CSV_URL}&time=${Date.now()}`);
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setData(results.data);
                    setLoading(false);
                }
            });
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const chartOption = useMemo(() => {
        if (!data || data.length === 0) return null;

        const greenDayMap = new Map();
        const uniFreeMap = new Map();

        data.forEach(row => {
            // Find keys (case-insensitive and trimmed) like in original HTML
            const findKey = (name) => Object.keys(row).find(k => k.trim().toLowerCase() === name);

            const gdTimeKey = findKey('gd_time');
            const gdFreeKey = findKey('greenday free');
            const uniTimeKey = findKey('uni_time');
            const uniFreeKey = findKey('uni free');

            if (gdTimeKey && gdFreeKey && row[gdTimeKey] && row[gdFreeKey]) {
                const ts = row[gdTimeKey].trim();
                const val = parseFloat(row[gdFreeKey]);
                if (!isNaN(val)) greenDayMap.set(ts, val);
            }
            if (uniTimeKey && uniFreeKey && row[uniTimeKey] && row[uniFreeKey]) {
                const ts = row[uniTimeKey].trim();
                const val = parseFloat(row[uniFreeKey]);
                if (!isNaN(val)) uniFreeMap.set(ts, val);
            }
        });

        const processMap = (map) => {
            const raw = Array.from(map.entries())
                .map(([t, v]) => ({ t: new Date(t), v, raw: t }))
                .filter(item => !isNaN(item.t.getTime()))
                .sort((a, b) => a.t - b.t);

            const solid = [];
            const gaps = [];
            const GAP_LIMIT = 40 * 60 * 1000;

            for (let i = 0; i < raw.length; i++) {
                solid.push([raw[i].raw, raw[i].v]);
                if (i < raw.length - 1 && (raw[i + 1].t - raw[i].t) > GAP_LIMIT) {
                    solid.push([raw[i + 1].raw, null]);
                    gaps.push([raw[i].raw, raw[i].v], [raw[i + 1].raw, raw[i + 1].v], [raw[i + 1].raw, null]);
                }
            }
            return { solid, gaps };
        };

        const gd = processMap(greenDayMap);
        const uni = processMap(uniFreeMap);
        const colors = PALETTES[palette];

        return {
            backgroundColor: 'transparent',
            animation: true,
            tooltip: {
                trigger: 'axis',
                confine: true,
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ['GreenDay', 'Uni Wroc'],
                top: 5,
                textStyle: { color: 'var(--text-secondary)' }
            },
            grid: { left: 50, right: 30, bottom: 80, top: 40, containLabel: true },
            xAxis: {
                type: 'time',
                axisLabel: { color: 'var(--text-secondary)' },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: 'var(--border)', opacity: 0.3 } },
                axisLabel: { color: 'var(--text-secondary)' }
            },
            dataZoom: [
                { type: 'inside', start: 80, end: 100 },
                { type: 'slider', start: 80, end: 100, textStyle: { color: 'var(--text-secondary)' } }
            ],
            series: [
                {
                    name: 'GreenDay', type: 'line', data: gd.solid, showSymbol: showSymbols,
                    lineStyle: { width: 3, color: colors.gd }, itemStyle: { color: colors.gd },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: `${colors.gd}33` },
                            { offset: 1, color: `${colors.gd}00` }
                        ])
                    },
                    markLine: { symbol: 'none', data: [{ yAxis: 187, lineStyle: { color: colors.gd, type: 'dotted', opacity: 0.5 }, label: { position: 'start', formatter: '187', color: colors.gd } }] }
                },
                { name: 'GreenDay', type: 'line', data: gd.gaps, showSymbol: false, lineStyle: { width: 2, color: colors.gd, type: 'dashed', opacity: 0.4 }, tooltip: { show: false } },
                {
                    name: 'Uni Wroc', type: 'line', data: uni.solid, showSymbol: showSymbols,
                    lineStyle: { width: 3, color: colors.uni }, itemStyle: { color: colors.uni },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: `${colors.uni}33` },
                            { offset: 1, color: `${colors.uni}00` }
                        ])
                    },
                    markLine: { symbol: 'none', data: [{ yAxis: 41, lineStyle: { color: colors.uni, type: 'dotted', opacity: 0.5 }, label: { position: 'start', formatter: '41', color: colors.uni } }] }
                },
                { name: 'Uni Wroc', type: 'line', data: uni.gaps, showSymbol: false, lineStyle: { width: 2, color: colors.uni, type: 'dashed', opacity: 0.4 }, tooltip: { show: false } }
            ]
        };
    }, [data, palette, showSymbols]);

    return (
        <>
            <Header title="Parking History" icon="📈" onRefresh={fetchData} updateStatus={loading ? 'Updating...' : 'Ready'} />
            <main className="stats-container">
                {loading && data.length === 0 ? (
                    <div className="loader">Loading history data...</div>
                ) : (
                    chartOption ? (
                        <ReactECharts
                            option={chartOption}
                            style={{ height: 'calc(100vh - 120px)', width: '100%' }}
                            notMerge={true}
                            lazyUpdate={true}
                        />
                    ) : (
                        <div className="loader">No data available to display.</div>
                    )
                )}

                <div className="controls-overlay">
                    <div className="palette-selector">
                        {Object.keys(PALETTES).map(p => (
                            <button
                                key={p}
                                className={`palette-dot ${palette === p ? 'active' : ''}`}
                                style={{ background: `linear-gradient(135deg, ${PALETTES[p].gd} 50%, ${PALETTES[p].uni} 50%)` }}
                                onClick={() => setPalette(p)}
                            />
                        ))}
                    </div>
                    <button className="toggle-btn" onClick={() => setShowSymbols(!showSymbols)}>
                        Dots: {showSymbols ? 'On' : 'Off'}
                    </button>
                </div>
            </main>
        </>
    );
};

export default Statistics;

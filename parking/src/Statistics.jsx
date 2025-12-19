import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const Statistics = ({ setView }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [palette, setPalette] = useState('neon');
    const [showSymbols, setShowSymbols] = useState(false);
    const { isLight } = useTheme();

    // Persistent zoom state to prevent reset on palette change
    const zoomRef = useRef({ start: 80, end: 100 });

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

        const textColor = isLight ? '#1e293b' : '#8b95c9';
        const gridColor = isLight ? '#cbd5e1' : '#2d3b6b';

        const greenDayMap = new Map();
        const uniFreeMap = new Map();

        data.forEach(row => {
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

        const getRawData = (map) => {
            return Array.from(map.entries())
                .map(([t, v]) => ({ t: new Date(t), v, raw: t }))
                .filter(item => !isNaN(item.t.getTime()))
                .sort((a, b) => a.t - b.t);
        };

        const rawGD = getRawData(greenDayMap);
        const rawUni = getRawData(uniFreeMap);

        // Find global max timestamp across all series
        const allTimestamps = [...rawGD.map(d => d.t.getTime()), ...rawUni.map(d => d.t.getTime())];
        const maxTime = allTimestamps.length > 0 ? Math.max(...allTimestamps) : null;

        // Find the raw string associated with this global max
        let globalMaxRaw = null;
        if (maxTime) {
            const foundGD = rawGD.find(d => d.t.getTime() === maxTime);
            const foundUni = rawUni.find(d => d.t.getTime() === maxTime);
            globalMaxRaw = (foundGD || foundUni)?.raw;
        }

        const processMapWithProjections = (raw, maxT, maxR) => {
            if (raw.length === 0) return { solid: [], gaps: [], projections: [] };

            const solid = [];
            const gaps = [];
            const projections = [];
            const GAP_LIMIT = 40 * 60 * 1000;

            for (let i = 0; i < raw.length; i++) {
                solid.push([raw[i].raw, raw[i].v]);
                if (i < raw.length - 1 && (raw[i + 1].t - raw[i].t) > GAP_LIMIT) {
                    solid.push([raw[i + 1].raw, null]);
                    gaps.push([raw[i].raw, raw[i].v], [raw[i + 1].raw, raw[i + 1].v], [raw[i + 1].raw, null]);
                }
            }

            // Correct projection logic: only if this line ends significantly before the global max
            const lastPoint = raw[raw.length - 1];
            if (lastPoint && maxT && (maxT - lastPoint.t.getTime()) > 1000) {
                // Add the connection point to ensure no gap between solid and projection
                projections.push([lastPoint.raw, lastPoint.v]);
                projections.push([maxR, lastPoint.v]);
            }

            return { solid, gaps, projections };
        };

        const gd = processMapWithProjections(rawGD, maxTime, globalMaxRaw);
        const uni = processMapWithProjections(rawUni, maxTime, globalMaxRaw);
        const colors = PALETTES[palette];

        // Dynamic legend names
        const gdName = rawGD.length > 0 ? 'GreenDay' : 'GreenDay - not found';
        const uniName = rawUni.length > 0 ? 'Uni Wroc' : 'Uni Wroc - not found';

        return {
            backgroundColor: 'transparent',
            animation: true,
            tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'cross' } },
            legend: {
                data: [gdName, uniName],
                top: 5,
                textStyle: { color: textColor }
            },
            grid: { left: 40, right: 20, bottom: 65, top: 40, containLabel: true },
            xAxis: {
                type: 'time',
                axisLabel: { color: textColor, margin: 10 },
                axisLine: { lineStyle: { color: gridColor } },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                min: -5,
                max: 200,
                splitLine: { lineStyle: { color: gridColor, opacity: 0.3 } },
                axisLabel: {
                    color: textColor,
                    formatter: (val) => val < 0 ? '' : val
                }
            },
            dataZoom: [
                { type: 'inside', start: zoomRef.current.start, end: zoomRef.current.end, filterMode: 'none' },
                { type: 'slider', start: zoomRef.current.start, end: zoomRef.current.end, bottom: 10, height: 25, textStyle: { color: textColor }, filterMode: 'none' }
            ],
            series: [
                // GreenDay
                {
                    name: gdName, type: 'line', data: gd.solid, showSymbol: showSymbols,
                    lineStyle: { width: 3, color: colors.gd }, itemStyle: { color: colors.gd },
                    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `${colors.gd}33` }, { offset: 1, color: `${colors.gd}00` }]) },
                    markLine: {
                        symbol: 'none',
                        data: [{
                            yAxis: 187,
                            lineStyle: { color: colors.gd, type: 'dotted', opacity: 1 },
                            label: { position: 'start', formatter: '187', color: colors.gd, fontWeight: 'bold', fontSize: 13 }
                        }]
                    }
                },
                { name: gdName, type: 'line', data: gd.gaps, showSymbol: false, lineStyle: { width: 2, color: colors.gd, type: 'dashed', opacity: 0.4 }, tooltip: { show: false } },
                {
                    name: gdName, type: 'line', data: gd.projections, showSymbol: false,
                    lineStyle: { width: 1.5, color: colors.gd, type: [5, 5], opacity: 0.5 },
                    tooltip: { show: false }
                },

                // Uni Wroc
                {
                    name: uniName, type: 'line', data: uni.solid, showSymbol: showSymbols,
                    lineStyle: { width: 3, color: colors.uni }, itemStyle: { color: colors.uni },
                    areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: `${colors.uni}33` }, { offset: 1, color: `${colors.uni}00` }]) },
                    markLine: {
                        symbol: 'none',
                        data: [{
                            yAxis: 41,
                            lineStyle: { color: colors.uni, type: 'dotted', opacity: 1 },
                            label: { position: 'start', formatter: '41', color: colors.uni, fontWeight: 'bold', fontSize: 13 }
                        }]
                    }
                },
                { name: uniName, type: 'line', data: uni.gaps, showSymbol: false, lineStyle: { width: 2, color: colors.uni, type: 'dashed', opacity: 0.4 }, tooltip: { show: false } },
                {
                    name: uniName, type: 'line', data: uni.projections, showSymbol: false,
                    lineStyle: { width: 1.5, color: colors.uni, type: [5, 5], opacity: 0.5 },
                    tooltip: { show: false }
                }
            ]
        };
    }, [data, palette, showSymbols, isLight]);

    const onChartEvents = {
        'datazoom': (params) => {
            if (params.batch && params.batch[0]) {
                zoomRef.current = { start: params.batch[0].start, end: params.batch[0].end };
            } else if (params.start !== undefined && params.end !== undefined) {
                zoomRef.current = { start: params.start, end: params.end };
            }
        }
    };

    return (
        <div className="page-wrapper">
            <Header
                title="Parking History"
                icon="📈"
                onRefresh={fetchData}
                updateStatus={loading ? 'Updating...' : 'Ready'}
                currentView="stats"
                setView={setView}
            >
                <div className="palette-group">
                    <span className="palette-label">Palette:</span>
                    {Object.keys(PALETTES).map(p => (
                        <div
                            key={p}
                            className={`palette-btn ${palette === p ? 'active' : ''}`}
                            style={{ background: `linear-gradient(135deg, ${PALETTES[p].gd} 50%, ${PALETTES[p].uni} 50%)` }}
                            onClick={() => setPalette(p)}
                            title={p.charAt(0).toUpperCase() + p.slice(1)}
                        />
                    ))}
                    <button className="palette-toggle-btn" onClick={() => setShowSymbols(!showSymbols)}>
                        Dots: {showSymbols ? 'Off' : 'On'}
                    </button>
                </div>
            </Header>
            <main className="stats-container">
                {loading && data.length === 0 ? (
                    <div className="loader">Loading history data...</div>
                ) : (
                    chartOption ? (
                        <ReactECharts
                            option={chartOption}
                            style={{ height: '100%', width: '100%' }}
                            onEvents={onChartEvents}
                            notMerge={false}
                            lazyUpdate={true}
                        />
                    ) : (
                        <div className="loader">No data available to display.</div>
                    )
                )}
            </main>
        </div>
    );
};

export default Statistics;

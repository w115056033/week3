import { useEffect, useRef, useState } from 'react';
import type { TemperatureForecastRow } from '../db';
import { shortDateLabel } from '../forecast';

interface TemperatureChartProps {
    /** 已依日期排序的單一地區預報資料 */
    rows: TemperatureForecastRow[];
}

/** 內距：留白給座標軸刻度文字 */
const PADDING = { top: 22, right: 20, bottom: 34, left: 44 };
/** 圖表高度範圍（px）：依容器寬度自適應，確保座標軸字級可讀 */
const MIN_HEIGHT = 230;
const MAX_HEIGHT = 300;

/** 折線圖：X 軸日期、Y 軸溫度、MaxT / MinT 兩條線（workflow 步驟 14） */
export default function TemperatureChart({ rows }: TemperatureChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    // 量測容器實際寬度，以 1:1 實際像素繪製，座標軸文字不會因縮放而看不清楚
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const observer = new ResizeObserver((entries) => {
            const next = Math.round(entries[0].contentRect.width);
            if (next > 0) setWidth(next);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const height = Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, width * 0.68)));

    if (rows.length === 0) {
        return (
            <div className="forecast-chart" ref={containerRef}>
                <div className="chart-empty">尚無預報資料</div>
            </div>
        );
    }

    const temperatures = rows.flatMap((row) => [row.minT, row.maxT]);
    const yMin = Math.floor(Math.min(...temperatures)) - 1;
    const yMax = Math.ceil(Math.max(...temperatures)) + 1;
    const innerWidth = Math.max(1, width - PADDING.left - PADDING.right);
    const innerHeight = Math.max(1, height - PADDING.top - PADDING.bottom);

    const x = (index: number) =>
        rows.length === 1 ? PADDING.left + innerWidth / 2 : PADDING.left + (index * innerWidth) / (rows.length - 1);
    const y = (temperature: number) => PADDING.top + innerHeight - ((temperature - yMin) / (yMax - yMin)) * innerHeight;


    // Y 軸刻度（最多約 5 條水平網格線）
    const ticks: number[] = [];
    const step = Math.max(1, Math.ceil((yMax - yMin) / 4));
    for (let tick = yMin; tick <= yMax; tick += step) ticks.push(tick);

    const pathOf = (pick: (row: TemperatureForecastRow) => number) =>
        rows.map((row, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(pick(row)).toFixed(1)}`).join(' ');

    return (
        <div className="forecast-chart" ref={containerRef}>
            <div className="chart-legend">
                <span className="max">最高氣溫 MaxT</span>
                <span className="min">最低氣溫 MinT</span>
            </div>
            {width === 0 ? (
                <div className="chart-placeholder" style={{ height }} />
            ) : (
                <svg width={width} height={height} role="img" aria-label="每日最高與最低氣溫折線圖">
                    <text className="chart-axis-title" x={6} y={13}>°C</text>
                    <text className="chart-axis-title" x={width - PADDING.right} y={height - 5} textAnchor="end">日期</text>
                    {ticks.map((tick) => (
                        <g key={tick}>
                            <line className="chart-grid" x1={PADDING.left} x2={width - PADDING.right} y1={y(tick)} y2={y(tick)} />
                            <text className="chart-y-label" x={PADDING.left - 7} y={y(tick) + 4} textAnchor="end">
                                {tick}°
                            </text>
                        </g>
                    ))}
                    <path className="chart-line chart-line-max" d={pathOf((row) => row.maxT)} />
                    <path className="chart-line chart-line-min" d={pathOf((row) => row.minT)} />
                    {rows.map((row, index) => (
                        <g key={row.date}>
                            <circle className="chart-dot chart-dot-max" cx={x(index)} cy={y(row.maxT)} r={4} />
                            <circle className="chart-dot chart-dot-min" cx={x(index)} cy={y(row.minT)} r={4} />
                            <text className="chart-value chart-value-max" x={x(index)} y={y(row.maxT) - 8} textAnchor="middle">
                                {row.maxT}°
                            </text>
                            <text className="chart-value chart-value-min" x={x(index)} y={y(row.minT) + 15} textAnchor="middle">
                                {row.minT}°
                            </text>
                            <text className="chart-x-label" x={x(index)} y={height - PADDING.bottom + 17} textAnchor="middle">
                                {shortDateLabel(row.date)}
                            </text>
                        </g>
                    ))}
                </svg>
            )}
        </div>
    );
}

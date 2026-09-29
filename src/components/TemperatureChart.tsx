import type { TemperatureForecastRow } from '../db';
import { shortDateLabel } from '../forecast';

interface TemperatureChartProps {
    /** 已依日期排序的單一地區預報資料 */
    rows: TemperatureForecastRow[];
}

/** SVG 畫布尺寸（以 viewBox 縮放，寬度隨面板自適應） */
const WIDTH = 640;
const HEIGHT = 210;
const PADDING = { top: 18, right: 16, bottom: 30, left: 36 };

/** 折線圖：X 軸日期、Y 軸溫度、MaxT / MinT 兩條線（workflow 步驟 14） */
export default function TemperatureChart({ rows }: TemperatureChartProps) {
    if (rows.length === 0) {
        return <div className="chart-empty">尚無預報資料</div>;
    }

    const temperatures = rows.flatMap((row) => [row.minT, row.maxT]);
    const yMin = Math.floor(Math.min(...temperatures)) - 1;
    const yMax = Math.ceil(Math.max(...temperatures)) + 1;
    const innerWidth = WIDTH - PADDING.left - PADDING.right;
    const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

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
        <div className="forecast-chart">
            <div className="chart-legend">
                <span className="max">最高氣溫 MaxT</span>
                <span className="min">最低氣溫 MinT</span>
            </div>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="每日最高與最低氣溫折線圖">
                {ticks.map((tick) => (
                    <g key={tick}>
                        <line className="chart-grid" x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(tick)} y2={y(tick)} />
                        <text className="chart-y-label" x={PADDING.left - 6} y={y(tick) + 3} textAnchor="end">
                            {tick}°
                        </text>
                    </g>
                ))}
                <path className="chart-line chart-line-max" d={pathOf((row) => row.maxT)} />
                <path className="chart-line chart-line-min" d={pathOf((row) => row.minT)} />
                {rows.map((row, index) => (
                    <g key={row.date}>
                        <circle className="chart-dot chart-dot-max" cx={x(index)} cy={y(row.maxT)} r={3.5} />
                        <circle className="chart-dot chart-dot-min" cx={x(index)} cy={y(row.minT)} r={3.5} />
                        <text className="chart-value chart-value-max" x={x(index)} y={y(row.maxT) - 7} textAnchor="middle">
                            {row.maxT}°
                        </text>
                        <text className="chart-value chart-value-min" x={x(index)} y={y(row.minT) + 13} textAnchor="middle">
                            {row.minT}°
                        </text>
                        <text className="chart-x-label" x={x(index)} y={HEIGHT - 9} textAnchor="middle">
                            {shortDateLabel(row.date)}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

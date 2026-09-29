import { ChartLine, ChevronDown, MapPin } from 'lucide-react';
import type { TemperatureForecastRow } from '../db';
import { shortDateLabel, weekdayOf } from '../forecast';
import TemperatureChart from './TemperatureChart';

interface ForecastPanelProps {
    /** 可選擇的地區（來自 SQLite DISTINCT 查詢） */
    regions: string[];
    /** 可選擇的日期（來自 SQLite DISTINCT 查詢） */
    dates: string[];
    selectedRegion: string;
    selectedDate: string;
    onRegionChange: (region: string) => void;
    onDateChange: (date: string) => void;
    /** 目前選取地區的預報資料（已依日期排序） */
    rows: TemperatureForecastRow[];
    loading: boolean;
    error: string | null;
    expanded: boolean;
    onToggle: () => void;
}

/**
 * 氣溫預報面板（workflow 步驟 13、14、15、16）：
 * 地區下拉選單 → 查詢 SQLite → 氣溫折線圖 + 每日氣溫資料表
 */
export default function ForecastPanel({
    regions,
    dates,
    selectedRegion,
    selectedDate,
    onRegionChange,
    onDateChange,
    rows,
    loading,
    error,
    expanded,
    onToggle,
}: ForecastPanelProps) {
    return (
        <section className="forecast-panel glass-panel">
            <button type="button" className="section-heading forecast-heading" onClick={onToggle} aria-expanded={expanded}>
                <span className="forecast-title">
                    <ChartLine size={15} /> 一週氣溫預報
                </span>
                <span className="update-time">
                    {loading ? '讀取中' : `${regions.length} 地區 · ${dates.length} 天`}
                    <ChevronDown size={13} className={expanded ? 'chevron-up' : 'chevron'} />
                </span>
            </button>

            {expanded && (
                <div className="forecast-body">
                    {/* 步驟 13：下拉選單選擇地區 */}
                    <div className="forecast-controls">
                        <label className="forecast-region">
                            <MapPin size={14} />
                            <select value={selectedRegion} onChange={(event) => onRegionChange(event.target.value)} aria-label="選擇地區">
                                {regions.length === 0 && <option value="">尚無地區資料</option>}
                                {regions.map((region) => (
                                    <option key={region} value={region}>
                                        {region}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* 步驟 18：選擇日期以更新台灣地圖 */}
                    <div className="date-pills">
                        {dates.map((date) => (
                            <button
                                key={date}
                                type="button"
                                className={date === selectedDate ? 'active' : ''}
                                onClick={() => onDateChange(date)}
                                title={`${date}（週${weekdayOf(date)}）`}
                            >
                                {shortDateLabel(date)}
                            </button>
                        ))}
                    </div>

                    {/* 步驟 14：最高 / 最低氣溫折線圖 */}
                    <TemperatureChart rows={rows} />

                    {/* 步驟 15：每日氣溫資料表（點選列可切換地圖日期） */}
                    <table className="forecast-table">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>星期</th>
                                <th>最低氣溫</th>
                                <th>最高氣溫</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.date}
                                    className={row.date === selectedDate ? 'active' : ''}
                                    onClick={() => onDateChange(row.date)}
                                >
                                    <td>{shortDateLabel(row.date)}</td>
                                    <td>週{weekdayOf(row.date)}</td>
                                    <td className="cell-min">{row.minT}°C</td>
                                    <td className="cell-max">{row.maxT}°C</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {error && <p className="forecast-error">{error}</p>}
                    {!error && rows.length === 0 && (
                        <p className="forecast-error">{loading ? '正在從 SQLite 資料庫讀取預報資料…' : '目前沒有預報資料，請稍後重新整理。'}</p>
                    )}
                    <p className="forecast-source">資料表 TemperatureForecasts（SQLite）· 每 30 分鐘自動更新</p>
                </div>
            )}
        </section>
    );
}


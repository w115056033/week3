/**
 * SQLite 資料庫層（workflow 步驟 8、9、10、12）
 *
 * 本專案部署於 Vercel 的靜態網站環境，無法保留伺服器端檔案，
 * 因此使用 sql.js（SQLite 編譯成 WebAssembly）在瀏覽器內建立 SQLite 資料庫：
 *
 *   建立資料庫 → 建立資料表 → 插入氣溫資料（避免重複）→ SQL 查詢 → 網站顯示
 *
 * 資料庫以 base64 字串存放在 localStorage（鍵名 data.db），等同保存 data.db 檔案。
 */
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { Database } from 'sql.js';

/** localStorage 中保存資料庫（data.db）的鍵名 */
const DB_STORAGE_KEY = 'data.db';

/** 氣溫預報一列資料：地區 + 日期 + 最低氣溫 + 最高氣溫 */
export interface TemperatureForecastRow {
    /** 地區（縣市名稱） */
    region: string;
    /** 預報日期，格式 YYYY-MM-DD */
    date: string;
    /** 最低氣溫（°C） */
    minT: number;
    /** 最高氣溫（°C） */
    maxT: number;
}

let databasePromise: Promise<Database | null> | null = null;

/** Uint8Array → base64（分塊轉換，避免參數過長造成堆疊溢位） */
const toBase64 = (bytes: Uint8Array): string => {
    let binary = '';
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }
    return btoa(binary);
};

/** base64 → Uint8Array */
const fromBase64 = (value: string): Uint8Array => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

/** 以 SQL 讀取查詢結果，回傳列物件陣列 */
const queryRows = (db: Database, sql: string, params: Array<string | number> = []): Record<string, unknown>[] => {
    const statement = db.prepare(sql);
    const rows: Record<string, unknown>[] = [];
    try {
        statement.bind(params);
        while (statement.step()) rows.push(statement.getAsObject());
    } finally {
        statement.free();
    }
    return rows;
};

/** 取得資料表現有筆數（步驟 10：查詢資料驗證） */
const countRows = (db: Database): number => {
    const row = queryRows(db, 'SELECT COUNT(*) AS total FROM TemperatureForecasts')[0];
    return Number(row?.total ?? 0);
};

/** 將資料庫匯出並存回 localStorage（模擬保存 data.db 檔） */
const persist = (db: Database): void => {
    try {
        localStorage.setItem(DB_STORAGE_KEY, toBase64(db.export()));
    } catch (error) {
        // 超過 localStorage 容量或隱私模式時僅警告，不中斷網站運作
        console.warn('[SQLite] 資料庫保存失敗：', error);
    }
};

/** 開啟（或建立）SQLite，並確保 TemperatureForecasts 資料表存在 */
async function openDatabase(): Promise<Database | null> {
    try {
        const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
        const cached = localStorage.getItem(DB_STORAGE_KEY);
        const db = new SQL.Database(cached ? fromBase64(cached) : undefined);
        // 步驟 9：資料表設計，以 (region, date) 作為主鍵以利去重
        db.run(
            `CREATE TABLE IF NOT EXISTS TemperatureForecasts (
                region TEXT NOT NULL,
                date   TEXT NOT NULL,
                MinT   REAL NOT NULL,
                MaxT   REAL NOT NULL,
                PRIMARY KEY (region, date)
            )`
        );
        return db;
    } catch (error) {
        console.error('[SQLite] 初始化失敗：', error);
        return null;
    }
}

/**
 * 步驟 8：插入氣溫預報資料。
 *
 * 使用 INSERT … ON CONFLICT DO UPDATE（依主鍵 upsert），
 * 因此重複執行同一份資料不會產生重複列（workflow 步驟 19）。
 * @returns 新增（非更新）的列數
 */
export async function saveForecasts(rows: TemperatureForecastRow[]): Promise<number> {
    const db = await getDatabase();
    if (!db || rows.length === 0) return 0;

    const before = countRows(db);
    db.run('BEGIN TRANSACTION');
    try {
        for (const row of rows) {
            db.run(
                `INSERT INTO TemperatureForecasts (region, date, MinT, MaxT) VALUES (?, ?, ?, ?)
                 ON CONFLICT(region, date) DO UPDATE SET MinT = excluded.MinT, MaxT = excluded.MaxT`,
                [row.region, row.date, row.minT, row.maxT]
            );
        }
        db.run('COMMIT');
    } catch (error) {
        db.run('ROLLBACK');
        throw error;
    }
    persist(db);
    return countRows(db) - before;
}

/** 移除指定日期之前的過期預報，避免資料表隨時間無限累積 */
export async function deleteForecastsBefore(date: string): Promise<void> {
    const db = await getDatabase();
    if (!db) return;
    db.run('DELETE FROM TemperatureForecasts WHERE date < ?', [date]);
    persist(db);
}

/**
 * 步驟 12：從資料庫讀取預報資料。
 * 可依地區 / 日期篩選；未提供篩選條件時回傳全部。
 */
export async function queryForecasts(filter: { region?: string; date?: string } = {}): Promise<TemperatureForecastRow[]> {
    const db = await getDatabase();
    if (!db) return [];

    const conditions: string[] = [];
    const params: string[] = [];
    if (filter.region) {
        conditions.push('region = ?');
        params.push(filter.region);
    }
    if (filter.date) {
        conditions.push('date = ?');
        params.push(filter.date);
    }
    const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

    return queryRows(db, `SELECT region, date, MinT, MaxT FROM TemperatureForecasts${where} ORDER BY region, date`, params)
        .map((row) => ({
            region: String(row.region),
            date: String(row.date),
            minT: Number(row.MinT),
            maxT: Number(row.MaxT),
        }))
        .filter((row) => row.region !== '' && row.date !== '' && Number.isFinite(row.minT) && Number.isFinite(row.maxT));
}

/** 以 SQL 查詢所有可選擇的地區（供下拉選單使用，步驟 13） */
export async function queryRegions(): Promise<string[]> {
    const db = await getDatabase();
    if (!db) return [];
    return queryRows(db, 'SELECT DISTINCT region FROM TemperatureForecasts ORDER BY region').map((row) => String(row.region));
}

/** 以 SQL 查詢所有可選擇的預報日期（供日期選擇使用，步驟 18） */
export async function queryForecastDates(): Promise<string[]> {
    const db = await getDatabase();
    if (!db) return [];
    return queryRows(db, 'SELECT DISTINCT date FROM TemperatureForecasts ORDER BY date').map((row) => String(row.date));
}

/** 步驟 10：以 SQL 驗證資料是否正確寫入（總筆數、地區數、日期數） */
export async function queryForecastStats(): Promise<{ rows: number; regions: number; dates: number }> {
    const db = await getDatabase();
    if (!db) return { rows: 0, regions: 0, dates: 0 };
    const row = queryRows(
        db,
        'SELECT COUNT(*) AS rows, COUNT(DISTINCT region) AS regions, COUNT(DISTINCT date) AS dates FROM TemperatureForecasts'
    )[0];
    return {
        rows: Number(row?.rows ?? 0),
        regions: Number(row?.regions ?? 0),
        dates: Number(row?.dates ?? 0),
    };
}

/** 取得單例資料庫連線（首次呼叫時建立） */
export function getDatabase(): Promise<Database | null> {
    if (!databasePromise) databasePromise = openDatabase();
    return databasePromise;
}

/**
 * sql.js 官方未附帶 TypeScript 宣告，此處提供本專案實際使用到的最小 API 介面。
 * @see https://github.com/sql-js/sql.js
 */
declare module 'sql.js' {
    export type BindParams = Array<string | number | Uint8Array | null>;

    export interface QueryExecResult {
        columns: string[];
        values: unknown[][];
    }

    export interface Statement {
        bind(params?: BindParams): boolean;
        step(): boolean;
        getAsObject(): Record<string, unknown>;
        reset(): void;
        free(): boolean;
    }

    export interface Database {
        run(sql: string, params?: BindParams): Database;
        exec(sql: string, params?: BindParams): QueryExecResult[];
        prepare(sql: string): Statement;
        export(): Uint8Array;
        close(): void;
    }

    export interface SqlJsStatic {
        Database: new (data?: Uint8Array) => Database;
    }

    export interface SqlJsConfig {
        locateFile?: (file: string) => string;
    }

    export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}

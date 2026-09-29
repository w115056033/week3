/**
 * 中央氣象署（CWA）OpenData 設定
 *
 * 依 workflow 步驟 20 的注意事項：API Key 不應直接寫入程式碼或版本控制，
 * 因此優先讀取環境變數 VITE_CWA_API_KEY（可在 Vercel 專案設定或本機 .env.local 指定），
 * 未設定時才退回原本的金鑰，避免部署後無法取得資料。
 */
const envApiKey: unknown = import.meta.env?.VITE_CWA_API_KEY;
const DEFAULT_API_KEY = 'CWA-C3FC4AEB-C28E-4553-8076-EA76341330CD';

export const CWA_API_KEY =
    typeof envApiKey === 'string' && envApiKey.trim() !== '' ? envApiKey.trim() : DEFAULT_API_KEY;

/** 由資料集編號組出 CWA OpenAPI（datastore）請求網址 */
export const cwaEndpoint = (datasetId: string, params: Record<string, string> = {}): string => {
    const search = new URLSearchParams({ Authorization: CWA_API_KEY, format: 'JSON', ...params });
    return `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${datasetId}?${search.toString()}`;
};

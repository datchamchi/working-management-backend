export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      PORT?: number;
      ACCESS_TOKEN_KEY: string;
      REFRESH_TOKEN_KEY: string;
      DB_HOST: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB: string;
    }
  }
}

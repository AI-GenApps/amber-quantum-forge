export interface AdSsvKeySource {
  getKey(keyId: string): Promise<string | null>;
}

export interface AdSsvRuntime {
  keySource: AdSsvKeySource;
  allowedAdUnits: readonly string[];
  maxAgeMs: number;
}

export interface AdSsvRecord {
  transactionId: string;
  subject: string;
  resultId: string;
  adUnit: string;
  rewardAmount: number;
  rewardItem: string;
  timestampMs: number;
  environment: string;
  receivedAt: string;
}

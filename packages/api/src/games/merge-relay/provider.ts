import type { MergeEnvironment, RewardGrantRequest } from "./contracts";

interface MergeRewardVerificationContext {
  environment: MergeEnvironment;
  subject: string;
  resultId: string;
  productId: string;
  kind: RewardGrantRequest["kind"];
}

interface MergeRewardAttestation {
  verified: boolean;
  providerTransactionId: string;
  environment: MergeEnvironment;
  subject: string;
  resultId: string;
  productId: string;
  kind: RewardGrantRequest["kind"];
  refunded: boolean;
  cancelled: boolean;
}

export interface MergeRewardProvider {
  verifySettlement(
    input: RewardGrantRequest,
    context: MergeRewardVerificationContext,
  ): Promise<MergeRewardAttestation>;
}

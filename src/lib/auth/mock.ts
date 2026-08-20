export const MOCK_OPERATOR = {
  email: "officialtermresult@gmail.com",
  uid: "mock-operator",
} as const;

export function isMockAuth(): boolean {
  return process.env.OUTREACH_MOCK_AUTH !== "0";
}

// Development helper for setting auth token
// This file should only be used for development/testing purposes

import { AuthToken } from "./api";

export const setDevToken = () => {
  // Set the test token from backend
  const testToken = "00b71b0799b3a0e832f11139d975dd53f7497506";
  AuthToken.set(testToken);
  console.log("Development auth token set");
};

export const clearDevToken = () => {
  AuthToken.remove();
  console.log("Development auth token cleared");
};

// Auto-set token in development if not present
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  if (!AuthToken.get()) {
    setDevToken();
  }
}

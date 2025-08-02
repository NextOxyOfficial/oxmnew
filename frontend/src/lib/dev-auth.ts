// Development helper for setting auth token
// This file should only be used for development/testing purposes

import { AuthToken } from "./api";

export const setDevToken = () => {
  // Set the test token from backend
  const testToken = "afe6a72967546a2088098b20f9cff3ed83c9942d";
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

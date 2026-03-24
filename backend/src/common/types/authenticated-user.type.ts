export type AuthenticatedUser = {
  userId: string;
  employeeId: string | null;
  roles: string[];
  permissions: string[];
  tokenType: "access" | "refresh";
};

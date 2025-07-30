import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the Lecturer type
type Lecturer = {
  uid:string,
  name: string;
  email: string;
  lecturer_id: string;
  nic?: string;
  status?: string;
  designation?: string;
};

// Update context type
type AuthContextType = {
  user: Lecturer | null;
  setUser: (user: Lecturer | null) => void;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Lecturer | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import {
  User,
  getCurrentUser,
  login as loginService,
  register as registerService,
  logout as logoutService,
} from "@/services/authService";

// Define the structure of the AuthContext
interface AuthContextType {
  user: User | null; // Current user data, null if not logged in
  loading: boolean; // Indicates if the authentication state is being loaded
  login: (email: string, password: string) => Promise<void>; // Function to log in a user
  register: (
    name: string,
    email: string,
    password: string,
    age?: number,
  ) => Promise<void>; // Function to register a new user
  logout: () => void; // Function to log out the current user
  error: string | null; // Stores any error messages related to authentication
}

// Create the AuthContext with a default value of undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component that wraps the app and provides the authentication context
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // State to hold the current user
  const [loading, setLoading] = useState(true); // State to indicate if the initial user loading is in progress
  const [error, setError] = useState<string | null>(null); // State to hold any error messages

  // useEffect hook to load the user data when the component mounts
  useEffect(() => {
    // Function to load the user data from local storage or an API
    const loadUser = async () => {
      try {
        // Check if token exists before making the API call
        const hasToken =
          typeof window !== "undefined" && !!localStorage.getItem("auth_token");
        if (!hasToken) {
          // Skip API call if no token exists
          setUser(null);
          return;
        }

        const userData = await getCurrentUser(); // Call the authService to get the current user
        setUser(userData); // Set the user state with the retrieved user data
      } catch (err) {
        console.error("Failed to load user", err); // Log any errors that occur during user loading
      } finally {
        setLoading(false); // Set loading to false once the user loading is complete, regardless of success or failure
      }
    };

    loadUser(); // Call the loadUser function when the component mounts
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Login function to authenticate a user
  const login = async (email: string, password: string) => {
    setError(null); // Clear any previous errors
    try {
      setLoading(true); // Set loading to true while the login process is in progress
      const { user } = await loginService(email, password); // Call the authService to log in the user
      setUser(user); // Set the user state with the logged-in user data
    } catch (err: any) {
      setError(err.message || "Failed to login"); // Set the error state with the error message
      throw err; // Throw the error to be handled by the calling component
    } finally {
      setLoading(false); // Set loading to false once the login process is complete
    }
  };

  // Register function to register a new user
  const register = async (
    name: string,
    email: string,
    password: string,
    age?: number,
  ) => {
    setError(null); // Clear any previous errors
    try {
      setLoading(true); // Set loading to true while the registration process is in progress
      const { user } = await registerService(name, email, password, age); // Call the authService to register the user
      setUser(user); // Set the user state with the registered user data
    } catch (err: any) {
      setError(err.message || "Failed to register"); // Set the error state with the error message
      throw err; // Throw the error to be handled by the calling component
    } finally {
      setLoading(false); // Set loading to false once the registration process is complete
    }
  };

  // Logout function to log out the current user
  const logout = () => {
    logoutService(); // Call the authService to log out the user
    setUser(null); // Set the user state to null
  };

  // Provide the AuthContext to the children components
  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext); // Get the AuthContext
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider"); // Throw an error if useAuth is used outside of an AuthProvider
  }
  return context; // Return the AuthContext
}

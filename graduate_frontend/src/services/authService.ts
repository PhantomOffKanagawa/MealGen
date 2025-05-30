import graphqlClient, { setAuthToken } from "./graphql";
import { gql } from "@apollo/client";

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  age?: number;
  role: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

// GraphQL Queries and Mutations
// GraphQL mutation for logging in a user
const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        name
        email
        age
        role
      }
    }
  }
`;

// GraphQL mutation for registering a new user
const REGISTER_MUTATION = gql`
  mutation Register(
    $name: String!
    $email: String!
    $password: String!
    $age: Int
  ) {
    register(name: $name, email: $email, password: $password, age: $age) {
      token
      user {
        _id
        name
        email
        age
        role
      }
    }
  }
`;

// GraphQL query to fetch the current user's data
const ME_QUERY = gql`
  query GetCurrentUser {
    me {
      _id
      name
      email
      age
      role
    }
  }
`;

// Auth Service Functions
/**
 * Logs in a user with the provided email and password.
 * @param email User's email address.
 * @param password User's password.
 * @returns A promise that resolves to the authentication response containing the token and user data.
 */
export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const result = await graphqlClient.mutate<{ login: AuthResponse }>({
      mutation: LOGIN_MUTATION,
      variables: { email, password },
    });
    const authData = result.data?.login;
    if (!authData) throw new Error("Login failed");
    setAuthToken(authData.token); // Store the authentication token
    return authData;
  } catch (error) {
    console.error("Login error:", error);
    throw error; // Re-throw the error for the calling component to handle
  }
};

/**
 * Registers a new user with the provided information.
 * @param name User's name.
 * @param email User's email address.
 * @param password User's password.
 * @param age User's age (optional).
 * @returns A promise that resolves to the authentication response containing the token and user data.
 */
export const register = async (
  name: string,
  email: string,
  password: string,
  age?: number,
): Promise<AuthResponse> => {
  try {
    const result = await graphqlClient.mutate<{ register: AuthResponse }>({
      mutation: REGISTER_MUTATION,
      variables: { name, email, password, age },
    });
    const authData = result.data?.register;
    if (!authData) throw new Error("Registration failed");
    setAuthToken(authData.token); // Store the authentication token
    return authData;
  } catch (error) {
    console.error("Register error:", error);
    throw error; // Re-throw the error for the calling component to handle
  }
};

/**
 * Retrieves the current user's data.
 * @returns A promise that resolves to the current user's data, or null if an error occurs.
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    if (!isAuthenticated()) return null; // Check if the user is authenticated before fetching data
    const result = await graphqlClient.query<{ me: User }>({
      query: ME_QUERY,
    });
    return result.data?.me ?? null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null; // Return null if there's an error fetching the user
  }
};

/**
 * Logs out the current user by removing the authentication token.
 */
export const logout = (): void => {
  setAuthToken(null); // Remove the authentication token
};

/**
 * Checks if the user is currently authenticated.
 * @returns True if the user is authenticated, false otherwise.
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("auth_token"); // Check if the authentication token exists in local storage
};

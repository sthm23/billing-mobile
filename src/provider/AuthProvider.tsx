import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_TOKEN = "fake-auth-token";

export enum AuthStorageKey {
    AUTH_TOKEN = "sthm23-access-token",
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(()=>{
        const loadAuthState = async () => {
            try {
                const token = await AsyncStorage.getItem(AuthStorageKey.AUTH_TOKEN);
                setAuthenticated(!!token);
            } catch (error) {
                console.error("Failed to load auth state:", error);
            } finally {
                setLoading(false);
            }
        };

        loadAuthState();
    }, [])


    const login = async () => {
        try {
            await AsyncStorage.setItem(AuthStorageKey.AUTH_TOKEN, FAKE_TOKEN);
            setAuthenticated(true);
        } catch (error) {
            console.error("Failed to login:", error);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem(AuthStorageKey.AUTH_TOKEN);
            setAuthenticated(false);
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}
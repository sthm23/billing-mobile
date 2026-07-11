import { LOCALE_STORAGE_KEYS } from "@/models/app.models";
import { AuthRequest } from "@/models/auth.model";
import { loginAuth, logoutAuth } from "@/services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
interface AuthContextType {
    isAuthenticated: boolean;
    login: (data: AuthRequest) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
                const token = await AsyncStorage.getItem(LOCALE_STORAGE_KEYS.TOKEN);
                setAuthenticated(!!token);
            } catch (error) {
                console.error("Failed to load auth state:", error);
            } finally {
                setLoading(false);
            }
        };

        loadAuthState();
    }, [])


    const login = async (data: AuthRequest) => {
        try {
            const response = await loginAuth(data)
            await AsyncStorage.setItem(LOCALE_STORAGE_KEYS.TOKEN, response.accessToken);
            setAuthenticated(true);
        } catch (error) {
            console.error("Failed to login:", error);
            throw error; // Rethrow the error so that the caller can handle it
        }
    };

    const logout = async () => {
        try {
            await logoutAuth({
                isAllDevices: true,
                sessionId: await AsyncStorage.getItem(LOCALE_STORAGE_KEYS.TOKEN) || ''
            });
            await AsyncStorage.removeItem(LOCALE_STORAGE_KEYS.TOKEN);
            setAuthenticated(false);
        } catch (error) {
            console.error("Failed to logout:", error);
            throw error; // Rethrow the error so that the caller can handle it
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}
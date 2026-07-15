import { LOCALE_STORAGE_KEYS } from "@/models/app.models";
import { AuthRequest, CurrentUserType } from "@/models/auth.model";
import { loginAuth, logoutAuth, profileAuth } from "@/services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
interface AuthContextType {
    isAuthenticated: boolean;
    user: CurrentUserType | null;
    login: (data: AuthRequest) => Promise<void>;
    logout: () => Promise<void>;
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
    const [user, setUser] = useState<CurrentUserType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(()=>{
        const loadAuthState = async () => {
            try {
                const token = await AsyncStorage.getItem(LOCALE_STORAGE_KEYS.TOKEN);

                if (!token) {
                    setAuthenticated(false);
                    setUser(null);
                    return;
                }

                setAuthenticated(true);

                try {
                    const profile = await profileAuth();
                    setUser(profile);
                    await AsyncStorage.setItem(LOCALE_STORAGE_KEYS.USER, JSON.stringify(profile));
                } catch (profileError) {
                    // Token exists but profile request failed: clear broken local session.
                    await AsyncStorage.multiRemove([
                        LOCALE_STORAGE_KEYS.TOKEN,
                        LOCALE_STORAGE_KEYS.USER,
                    ]);
                    setAuthenticated(false);
                    setUser(null);
                    console.error("Failed to bootstrap user profile:", profileError);
                }
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

            const profile = await profileAuth();
            setUser(profile);
            await AsyncStorage.setItem(LOCALE_STORAGE_KEYS.USER, JSON.stringify(profile));

            setAuthenticated(true);
        } catch (error) {
            await AsyncStorage.multiRemove([
                LOCALE_STORAGE_KEYS.TOKEN,
                LOCALE_STORAGE_KEYS.USER,
            ]);
            setAuthenticated(false);
            setUser(null);
            console.error("Failed to login:", error);
            throw error; // Rethrow the error so that the caller can handle it
        }
    };

    const logout = async () => {
        const sessionId = await AsyncStorage.getItem(LOCALE_STORAGE_KEYS.TOKEN);

        try {
            await logoutAuth({
                isAllDevices: true,
                sessionId: sessionId || ''
            });
        } catch (error) {
            console.error("Failed to logout API call:", error);
        } finally {
            await AsyncStorage.multiRemove([
                LOCALE_STORAGE_KEYS.TOKEN,
                LOCALE_STORAGE_KEYS.USER,
            ]);
            setAuthenticated(false);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {loading ? null : children}
        </AuthContext.Provider>
    )
}
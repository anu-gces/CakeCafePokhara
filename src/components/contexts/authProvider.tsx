import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../firebase/firebase";

interface AuthContextValue {
	userLoggedIn: boolean;
	isEmailUser: boolean;
	isGoogleUser: boolean;
	currentUser: User | null;
	setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
	undefined,
);

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [userLoggedIn, setUserLoggedIn] = useState(false);
	const [isEmailUser, setIsEmailUser] = useState(false);
	const [isGoogleUser, setIsGoogleUser] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, initializeUser);
		return unsubscribe;
	}, []);

	async function initializeUser(user: User | null) {
		if (user) {
			setCurrentUser(user);

			const isEmail = user.providerData.some(
				(provider) => provider.providerId === "password",
			);
			setIsEmailUser(isEmail);

			const isGoogle = user.providerData.some(
				(provider) => provider.providerId === "google.com",
			);
			setIsGoogleUser(isGoogle);

			setUserLoggedIn(true);
		} else {
			setCurrentUser(null);
			setUserLoggedIn(false);
		}

		setLoading(false);
	}

	const value = {
		userLoggedIn,
		isEmailUser,
		isGoogleUser,
		currentUser,
		setCurrentUser,
	};

	return (
		<AuthContext.Provider value={value}>
			{!loading && children}
		</AuthContext.Provider>
	);
};

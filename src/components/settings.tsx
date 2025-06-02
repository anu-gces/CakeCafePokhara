import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Settings() {
	const handleAccountChangeClick = () => {
		window.open("https://myaccount.google.com/", "_blank");
	};

	const handlePasswordChangeClick = () => {
		window.open("https://myaccount.google.com/security", "_blank");
	};

	return (
		<Tabs
			defaultValue="account"
			className="w-[400px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
		>
			<TabsList className="grid w-full grid-cols-2">
				<TabsTrigger value="account">Account</TabsTrigger>
				<TabsTrigger value="password">Password</TabsTrigger>
			</TabsList>
			<TabsContent value="account">
				<Card>
					<CardHeader>
						<CardTitle>Account</CardTitle>
						<CardDescription>
							Click below to modify your account.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<Button onClick={handleAccountChangeClick}>
							Change Account Details
						</Button>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="password">
				<Card>
					<CardHeader>
						<CardTitle>Password</CardTitle>
						<CardDescription>
							Click below to change your password.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<Button onClick={handlePasswordChangeClick}>Change Password</Button>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}

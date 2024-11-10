import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { LogIn, LogOut } from "lucide-react";
import { useEffect } from "react";

export default function Navbar() {
  const { login, logout, authenticated, user } = usePrivy();

  useEffect(() => {
    if (authenticated && user) {
      handleUserAuthenticated();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, user]);

  const handleUserAuthenticated = async () => {
    if (user && user.wallet?.address) {
      try {
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: user.wallet.address,
            email: user.email?.address || "",
          }),
        });
      } catch (error) {
        console.error("Error updating user information:", error);
      }
    }
  };  

  const handleAuth = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  return (
    <>
      <nav className="flex justify-between items-center mb-1 py-2 pt-4 px-4 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <Image
            src="/svg/lock-square-rounded.svg"
            alt="HTTP3 logo"
            width={40}
            height={40}
            priority
          />
          <span className="ml-2 text-xl font-bold">IPVault</span>
        </Link>
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-foreground hover:text-primary"
          >
            Dashboard
          </Link>
          <Link href="/search" className="text-foreground hover:text-primary">
            Search
          </Link>
          <Link href="/docs" className="text-foreground hover:text-primary">
            Docs
          </Link>
          <Button onClick={handleAuth} variant="outline">
            {authenticated ? (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </>
            )}
          </Button>
        </div>
      </nav>
    </>
  );
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default async function HomePage() {
  const session = await auth();
  
  // If user is authenticated, redirect to onboarding or matches
  if (session) {
    const user = session as any;
    if (user.onboarded) {
      redirect("/matches");
    } else {
      redirect("/onboarding/role");
    }
  }
  
  return <LandingPage />;
}

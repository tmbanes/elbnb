import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const setups = [
  {
    href: "/signup",
    title: "Email + Password",
    description: "Standard authentication flow.",
    highlights: [
      "Toggle sign in/sign up",
      "Show the session panel",
      "Explain password rules",
    ],
  },
  {
    href: "/google-login",
    title: "Google Login",
    description: "OAuth social provider integration.",
    highlights: [
      "Redirect URLs",
      "Call signInWithOAuth",
      "Watch session update",
    ],
  },
  {
    href: "/onboarding",
    title: "Onboarding Sign In + Log In",
    description: "Interactive multi-step entry.",
    highlights: [
      "Interactive onboarding UI (HOUSE)",
      "Sign up and login doors",
      "Role selection",
    ],
  },
  {
    href: "/dashboard/admin/housing",
    title: "Housing Inventory Management",
    description: "Admin dashboard controls.",
    highlights: [
      "Dormitory CRUD",
      "Room and Bed Space Logic",
      "Facility-Manager Mapping",
    ],
  },
] as const;

export default function Home() {
  return (
    <div className="container mx-auto py-16 px-6">
      <header className="mb-12 space-y-2">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Elbnb</p>
        <h1 className="text-3xl font-bold tracking-tight">User Authentication Setup</h1>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {setups.map((setup) => (
          <Card key={setup.href} size="sm" className="flex flex-col">
            <CardHeader>
              <CardTitle>{setup.title}</CardTitle>
              <CardDescription>{setup.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {setup.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={setup.href}>
                  Open Flow
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}
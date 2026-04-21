import { redirectByRole } from "@/lib/auth/client-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardAction
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"


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

export default async function Home() {
  await redirectByRole();

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


      {/* SAMPLE UI COMPONENTS (shadcn-ui) */}
      <Separator className="my-12" />

      <section className="mt-12">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Sample UI Components
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">

          {/* Context Menu */}
          <ContextMenu>
            <ContextMenuTrigger className="flex aspect-video w-full max-w-xs items-center justify-center rounded-xl border border-dashed text-sm">
              <span className="hidden pointer-fine:inline-block">
                Right click here
              </span>
              <span className="hidden pointer-coarse:inline-block">
                Long press here
              </span>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuGroup>
                <ContextMenuItem>
                  Back
                  <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem disabled>
                  Forward
                  <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  Reload
                  <ContextMenuShortcut>⌘R</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-44">
                    <ContextMenuGroup>
                      <ContextMenuItem>Save Page...</ContextMenuItem>
                      <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                      <ContextMenuItem>Name Window...</ContextMenuItem>
                    </ContextMenuGroup>
                    <ContextMenuSeparator />
                    <ContextMenuGroup>
                      <ContextMenuItem>Developer Tools</ContextMenuItem>
                    </ContextMenuGroup>
                    <ContextMenuSeparator />
                    <ContextMenuGroup>
                      <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
                    </ContextMenuGroup>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuCheckboxItem checked>
                  Show Bookmarks
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuGroup>
                <ContextMenuRadioGroup value="pedro">
                  <ContextMenuLabel>People</ContextMenuLabel>
                  <ContextMenuRadioItem value="pedro">
                    Pedro Duarte
                  </ContextMenuRadioItem>
                  <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>

          {/* Card */}
          <Card className="relative mx-auto w-full max-w-sm pt-0">
            <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
            <img
              src="https://avatar.vercel.sh/shadcn1"
              alt="Event cover"
              className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40"
            />
            <CardHeader>
              <CardAction>
                <Badge variant="secondary">Featured</Badge>
              </CardAction>
              <CardTitle>Design systems meetup</CardTitle>
              <CardDescription>
                A practical talk on component APIs, accessibility, and shipping
                faster.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full">View Event</Button>
            </CardFooter>
          </Card>

          <Accordion
            type="single"
            collapsible
            defaultValue="shipping"
            className="max-w-lg"
          >
            <AccordionItem value="shipping">
              <AccordionTrigger>What are your shipping options?</AccordionTrigger>
              <AccordionContent>
                We offer standard (5-7 days), express (2-3 days), and overnight
                shipping. Free shipping on international orders.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="returns">
              <AccordionTrigger>What is your return policy?</AccordionTrigger>
              <AccordionContent>
                Returns accepted within 30 days. Items must be unused and in original
                packaging. Refunds processed within 5-7 business days.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support">
              <AccordionTrigger>How can I contact customer support?</AccordionTrigger>
              <AccordionContent>
                Reach us via email, live chat, or phone. We respond within 24 hours
                during business days.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>
      </section>

    </div>
  );
}

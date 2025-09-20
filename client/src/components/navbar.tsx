import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BarChart3, Home, FolderOpen, ArrowLeft, Sun, Moon,AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";

interface NavbarProps {
  DisplayTitle?: string;
  subtitle?: string;
  setSelectedProjectId?: (id: string) => void;
}

export function Navbar({ DisplayTitle, subtitle, setSelectedProjectId   }: NavbarProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
console.log(theme)
  const navigationItems = [
    // { href: "/", label: "Dashboard", icon: Home },
    // { href: "/projects", label: "Projects", icon: FolderOpen },
    // { href: "/analytics", label: "Analytics", icon: BarChart3 },
    // { href: "/risks", label: "Risks", icon: AlertTriangle },
  ];

  return (
    <nav className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50">
      <div className="px-2 sm:px-6 lg:px-1">
        <div className="flex justify-between h-16">
          {/* Logo and Company Name */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-16 h-16 mr-1  flex items-center justify-center">
                  {/* <BarChart3 className="h-5 w-5 text-white" /> */}
                  <img src="/samplelogo.png" alt="Logo" className="w-15 h-15"/>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {DisplayTitle || "Sample Dashboard"}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {subtitle || "Project Performance Dashboard"}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Show Back to Sample Dashboard button if props exist */}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                // <Link key={item.href} href={item.href}>
                  <Button
                  onClick={() => setSelectedProjectId(null)}
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                // </Link>
              );
            })}
            {(DisplayTitle || subtitle) && (
              // <Link href="/">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProjectId(null)}
                  size="sm"
                  className="flex items-center gap-2"
                        style={{backgroundColor:"rgb(22,142,255)",color:"white"}}

                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sample Dashboard
                </Button>
              // </Link>
            )}
            
            {/* Dark Mode Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">
                        {DisplayTitle || "Sample Dashboard"}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {subtitle || "Project Performance Dashboard"}
                      </p>
                    </div>
                  </div>

                  {/* Back to Sample Dashboard button (mobile) */}
                  {(DisplayTitle || subtitle) && (
                    // <Link href="/">
                      <Button
                        variant="outline"
                        size="sm"
                        style={{backgroundColor:"rgb(22,142,255)",color:"white"}}
                        className="flex items-center gap-2 "
                        onClick={() =>{ setIsOpen(false); setSelectedProjectId(null)}}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sample Dashboard
                      </Button>
                    // </Link>
                  )}
                  
                  {/* Dark Mode Toggle (mobile) */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                      setIsOpen(false);
                    }}
                    data-testid="button-theme-toggle-mobile"
                    className="flex items-center gap-2"
                  >
                    {theme === "dark" ? (
                      <><Sun className="h-4 w-4" /> Light Mode</>
                    ) : (
                      <><Moon className="h-4 w-4" /> Dark Mode</>
                    )}
                  </Button>

                  {/* {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          className="w-full justify-start flex items-center space-x-3"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Button>
                      </Link>
                    );
                  })} */}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

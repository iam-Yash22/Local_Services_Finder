import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X, LogOut, User, Shield, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading">LocalFind</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {user && (
            <Link to="/services">
              <Button variant="ghost" size="sm">{t("nav.browse")}</Button>
            </Link>
          )}
          {user && role === "provider" && (
            <Link to="/add-service">
              <Button variant="ghost" size="sm">
                <Wrench className="mr-1 h-4 w-4" />{t("nav.addService")}
              </Button>
            </Link>
          )}
          {user && role === "admin" && (
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <Shield className="mr-1 h-4 w-4" />{t("nav.admin")}
              </Button>
            </Link>
          )}
          <LanguageToggle />
          {user ? (
            <div className="ml-2 flex items-center gap-1">
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  <User className="mr-1 h-4 w-4" />{t("nav.profile")}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1 h-4 w-4" />{t("nav.signOut")}
              </Button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">{t("nav.signIn")}</Button></Link>
              <Link to="/register"><Button size="sm">{t("nav.getStarted")}</Button></Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={t(open ? "nav.closeMenu" : "nav.openMenu")}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {user && (
              <Link to="/services" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">{t("nav.browse")}</Button>
              </Link>
            )}
            {user && role === "provider" && (
              <Link to="/add-service" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">{t("nav.addService")}</Button>
              </Link>
            )}
            {user && role === "admin" && (
              <Link to="/admin" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">{t("nav.admin")}</Button>
              </Link>
            )}
            <div className="px-1 py-1"><LanguageToggle /></div>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">{t("nav.profile")}</Button>
                </Link>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                  {t("nav.signOut")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">{t("nav.signIn")}</Button>
                </Link>
                <Link to="/register" onClick={() => setOpen(false)}>
                  <Button size="sm" className="w-full">{t("nav.getStarted")}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

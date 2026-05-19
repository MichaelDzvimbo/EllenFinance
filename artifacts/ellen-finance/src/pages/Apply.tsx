import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Apply() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/auth"); }, [setLocation]);
  return null;
}

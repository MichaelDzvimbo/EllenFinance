import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({ title: "Settings Saved", description: "Your preferences have been updated." });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-serif font-medium tracking-tight">Platform Settings</h2>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>System Parameters</CardTitle>
            <CardDescription>Configure global operational variables for the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Interest Rate (%)</Label>
                <Input defaultValue="15" type="number" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Penalty Rate (Daily %)</Label>
                <Input defaultValue="1.5" type="number" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Max Loan Duration (Months)</Label>
                <Input defaultValue="12" type="number" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Min Loan Amount ($)</Label>
                <Input defaultValue="50" type="number" className="bg-background" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-border flex justify-end">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="h-4 w-4 mr-2" /> Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

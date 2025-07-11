"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface UserSettings {
  workHours: {
    start: string;
    end: string;
  };
  workDays: number[];
}

const daysOfWeek = [
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
  { id: 6, label: "Saturday" },
  { id: 0, label: "Sunday" },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#ffffff");

  useEffect(() => {
    if (status === "authenticated") {
      fetchUserSettings();
      fetchCategories();
    }
  }, [status]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/user/categories");
      if (response.ok) {
        setCategories(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      console.error("Category name cannot be empty.");
      return;
    }
    try {
      const response = await fetch("/api/user/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
      });
      if (response.ok) {
        fetchCategories(); // Refresh categories
        setNewCategoryName("");
        setNewCategoryColor("#ffffff");
      }
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/user/categories/${id}`, { method: "DELETE" });
      fetchCategories(); // Refresh categories
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const fetchUserSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Failed to fetch user settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!response.ok) {
        throw new Error("Failed to save settings");
      }
      // Add user feedback, e.g., a toast notification
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handleWorkDayChange = (dayId: number) => {
    if (!settings) return;
    const newWorkDays = settings.workDays.includes(dayId)
      ? settings.workDays.filter((d) => d !== dayId)
      : [...settings.workDays, dayId];
    setSettings({ ...settings, workDays: newWorkDays });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!settings) {
    return <div>Failed to load settings.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile & Settings</h1>
      <div className="space-y-8">
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Busy Hour Categories</h2>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: category.color }} />
                <span>{category.name}</span>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Input 
            placeholder="Category Name" 
            value={newCategoryName} 
            onChange={(e) => setNewCategoryName(e.target.value)} 
          />
          <Input 
            type="color" 
            value={newCategoryColor} 
            onChange={(e) => setNewCategoryColor(e.target.value)} 
            className="w-16"
          />
          <Button onClick={handleAddCategory}>Add Category</Button>
        </div>
      </div>
    </div>
  );
}
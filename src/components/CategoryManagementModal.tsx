
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoryManagementModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCategoriesUpdated: () => void;
  isReadOnly?: boolean;
}

export function CategoryManagementModal({
  isOpen,
  setIsOpen,
  onCategoriesUpdated,
  isReadOnly = false,
}: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<{id: string; name: string; color: string}[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#ffffff");

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/user/categories");
      if (response.ok) {
        setCategories(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  const handleAddCategory = async () => {
    if (isReadOnly) return;
    
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
        onCategoriesUpdated(); // Notify parent to refresh
        setNewCategoryName("");
        setNewCategoryColor("#ffffff");
      }
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (isReadOnly) return;
    
    try {
      await fetch(`/api/user/categories/${id}`, { method: "DELETE" });
      fetchCategories(); // Refresh categories
      onCategoriesUpdated(); // Notify parent to refresh
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Busy Hour Categories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {categories.length === 0 ? (
            <p className="text-muted-foreground">No custom categories yet. Add one below!</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteCategory(category.id)}
                  disabled={isReadOnly}
                >
                  Delete
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Input 
            placeholder="Category Name" 
            value={newCategoryName} 
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={isReadOnly}
          />
          <Input 
            type="color" 
            value={newCategoryColor} 
            onChange={(e) => setNewCategoryColor(e.target.value)} 
            className="w-16"
            disabled={isReadOnly}
          />
          <Button onClick={handleAddCategory} disabled={isReadOnly}>
            {isReadOnly ? 'Preview Mode' : 'Add Category'}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

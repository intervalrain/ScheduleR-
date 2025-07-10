
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setAvatar(session.user.image || "");
    }
  }, [session]);

  if (status === "loading") {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!session) {
    return <div className="p-6">Please log in to view your profile.</div>;
  }

  const handleUpdateProfile = async () => {
    // Placeholder for API call to update user profile
    // const response = await fetch("/api/user/profile", {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ name, email, avatar }),
    // });
    // const updatedUser = await response.json();
    alert("Profile updated (mock)");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full" disabled />
        </div>
        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">Avatar URL</label>
          <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} className="mt-1 block w-full" />
        </div>
        <Button onClick={handleUpdateProfile}>Update Profile</Button>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Team Management</h2>
      <div className="space-y-4">
        {/* Team creation/joining forms will go here */}
        <p>Team management features coming soon.</p>
      </div>
    </div>
  );
}

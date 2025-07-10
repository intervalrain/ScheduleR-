
"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  UserIcon, 
  MailIcon, 
  UsersIcon, 
  PlusIcon
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  role: string;
  members: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      setAvatar(session.user.image || "");
      
      // Mock teams data - in real app, fetch from API
      setTeams([
        { id: "1", name: "Development Team", role: "Owner", members: 5 },
        { id: "2", name: "Design Squad", role: "Member", members: 3 },
      ]);
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-[200px]"></div>
                  <div className="h-4 bg-gray-200 rounded w-[150px]"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <UserIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Sign in Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to view and manage your profile.
            </p>
            <Button onClick={() => signIn("google")} className="w-full">
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // API call to update user profile
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      
      if (response.ok) {
        // Show success message
        alert("Profile updated successfully!");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    
    try {
      // API call to create team
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });
      
      if (response.ok) {
        const newTeam = await response.json();
        setTeams([...teams, newTeam]);
        setNewTeamName("");
        alert("Team created successfully!");
      }
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team. Please try again.");
    }
  };

  const handleJoinTeam = async () => {
    if (!joinTeamCode.trim()) return;
    
    try {
      // API call to join team
      const response = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinTeamCode }),
      });
      
      if (response.ok) {
        const team = await response.json();
        setTeams([...teams, team]);
        setJoinTeamCode("");
        alert("Successfully joined team!");
      }
    } catch (error) {
      console.error("Error joining team:", error);
      alert("Failed to join team. Please check the invite code.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="text-lg">
                {name?.charAt(0) || email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{name || "Unnamed User"}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MailIcon className="w-3 h-3" />
                {email}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Display Name
              </label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input 
                id="email" 
                value={email} 
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="avatar" className="text-sm font-medium">
              Avatar URL
            </label>
            <Input 
              id="avatar" 
              value={avatar} 
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="Enter avatar URL"
            />
          </div>

          <Button 
            onClick={handleUpdateProfile} 
            disabled={loading}
            className="w-full md:w-auto"
          >
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Team Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Teams */}
          <div className="space-y-3">
            <h4 className="font-medium">Your Teams</h4>
            {teams.length > 0 ? (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div 
                    key={team.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.members} members
                        </p>
                      </div>
                    </div>
                    <Badge variant={team.role === "Owner" ? "default" : "secondary"}>
                      {team.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">You&apos;re not part of any teams yet.</p>
            )}
          </div>

          <Separator />

          {/* Create/Join Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Create New Team</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <Button onClick={handleCreateTeam} size="sm">
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Join Team</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Invite code"
                  value={joinTeamCode}
                  onChange={(e) => setJoinTeamCode(e.target.value)}
                />
                <Button onClick={handleJoinTeam} size="sm" variant="outline">
                  Join
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

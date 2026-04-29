"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, User, Bell, Shield, Wallet, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          emailNotifications: profile.emailNotifications,
          riskNotifications: profile.riskNotifications,
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Update failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    setPasswordSaving(true);
    try {
      const token = localStorage.getItem("flowcapital_token");
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword
        })
      });

      if (res.ok) {
        setShowPasswordModal(false);
        setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setMessage({ type: 'success', text: 'Password changed successfully' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Password change failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("flowcapital_token");
    localStorage.removeItem("flowcapital_user");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 relative">
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-8 z-50 p-4 rounded-lg shadow-xl border ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profiles, security, and notification preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-secondary/20">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-blue-600 text-white text-xl">
                    {(profile?.name || profile?.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile?.name || "No name set"}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded text-xs font-bold">{profile?.role}</span>
                    <span>{profile?.email}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Display Name</label>
                   <Input 
                    value={profile?.name || ""} 
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    placeholder="Enter your name"
                    className="bg-background/50" 
                  />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Email Address</label>
                   <Input value={profile?.email || ""} disabled className="bg-background/50 opacity-50" />
                 </div>
               </div>
            </CardContent>
            <CardFooter className="bg-secondary/10 border-t border-border/40 py-3">
               <Button 
                onClick={handleUpdateProfile} 
                className="bg-blue-600 hover:bg-blue-700 text-white ml-auto"
                disabled={saving}
               >
                {saving ? "Saving..." : "Update Profile"}
               </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Security & Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                  <span className="text-sm">Email Alerts</span>
                  <button 
                    onClick={() => setProfile({...profile, emailNotifications: !profile.emailNotifications})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${profile?.emailNotifications ? 'bg-blue-600' : 'bg-gray-400'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${profile?.emailNotifications ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 transition-colors">
                  <span className="text-sm">Risk Score Updates</span>
                  <button 
                    onClick={() => setProfile({...profile, riskNotifications: !profile.riskNotifications})}
                    className={`w-10 h-5 rounded-full relative transition-colors ${profile?.riskNotifications ? 'bg-blue-600' : 'bg-gray-400'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${profile?.riskNotifications ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </CardContent>
           </Card>

           <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={() => setShowPasswordModal(true)} className="w-full justify-start gap-2 h-10 glass">
                  Change Password
                </Button>
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                  <span className="text-sm opacity-70 italic">Two-Factor Auth (Coming Soon)</span>
                </div>
              </CardContent>
           </Card>
        </div>

        {/* Account Actions */}
        <Card className="glass-card">
          <CardHeader>
             <CardTitle className="text-lg">Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
             <Button variant="outline" onClick={handleLogout} className="h-20 flex-col gap-2 border-destructive/30 hover:bg-destructive/10 text-destructive group">
               <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
               <span className="text-xs">Log Out</span>
             </Button>
          </CardContent>
        </Card>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md">
              <Card className="glass shadow-2xl">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your security credentials.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Current Password</label>
                       <Input 
                        type="password" 
                        required 
                        value={passwords.oldPassword} 
                        onChange={e => setPasswords({...passwords, oldPassword: e.target.value})}
                        className="bg-background/50" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">New Password</label>
                       <Input 
                        type="password" 
                        required 
                        minLength={6}
                        value={passwords.newPassword} 
                        onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                        className="bg-background/50" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Confirm New Password</label>
                       <Input 
                        type="password" 
                        required 
                        value={passwords.confirmPassword} 
                        onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                        className="bg-background/50" 
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={passwordSaving}>
                        {passwordSaving ? "Saving..." : "Change Password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

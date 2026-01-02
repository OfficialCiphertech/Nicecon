
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Smartphone, User, CheckCircle2, AlertCircle, FileCheck, Download as DownloadIcon, HelpCircle, Apple, UserPlus, Trash2, Edit2, Search, Upload, X, ShieldCheck, Users, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const JoinSession = () => {
  const { sessionId } = useParams();
  const { user } = useAuth(); // Get current authenticated user
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFull, setIsFull] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  
  // Phone handling state
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [canDownload, setCanDownload] = useState(false);
  const { toast } = useToast();

  const LOCAL_STORAGE_KEY = `vcf_session_submissions_${sessionId}`;
  const SUBMISSION_LIMIT = 3;

  // Check if current user is the creator of this session
  const isCreator = user && session && user.id === session.user_id;

  // Real-time subscription setup
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to session changes (to update participant count in real-time)
    const sessionChannel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vcf_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new) {
            setSession(prev => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    // Subscribe to participant changes (to update list real-time when on download page or for admin)
    const participantsChannel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          // If we are viewing the list (Creator or Expired), refresh the list
          // Note: RLS might block receiving the payload if not allowed, but we can try to fetch
          if (isExpired || isCreator) {
             const { data: parts } = await supabase
               .from('participants')
               .select('*')
               .eq('session_id', sessionId);
             if (parts) {
               setParticipants(parts);
               // Preserve search filter if active
               if (searchQuery) {
                   // filter logic will run via useEffect dependency on participants
               } else {
                   setFilteredParticipants(parts);
               }
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [sessionId, isExpired, isCreator, searchQuery]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('vcf_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (!error && data) {
        setSession(data);
        const created = new Date(data.created_at);
        const exp = new Date(created.getTime() + data.duration_minutes * 60000);
        setExpiresAt(exp);
        const now = new Date();

        const localSubmissions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
        if (localSubmissions.length >= SUBMISSION_LIMIT) {
          setIsFull(true);
        }

        // Check expiration
        if (now > exp) {
          setIsExpired(true);
        }
        
        // Fetch participants if:
        // 1. Session is expired (Public needs them for VCF)
        // 2. User is Creator (Needs them to manage)
        // Note: RLS policy MUST allow this for it to work for public
        if (now > exp || (user && user.id === data.user_id)) {
             const { data: parts } = await supabase
            .from('participants')
            .select('*')
            .eq('session_id', sessionId);
            
            setParticipants(parts || []);
            setFilteredParticipants(parts || []);
        }
      }
      setLoading(false);
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, LOCAL_STORAGE_KEY, user]);

  // Handle Download Timer
  useEffect(() => {
    if (isExpired && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isExpired) {
      setCanDownload(true);
    }
  }, [isExpired, countdown]);

  // Filter Logic
  useEffect(() => {
    // Also run filter logic if expired (for public search if enabled) or creator
    if (!isCreator && !isExpired) return;

    if (searchQuery.trim() === '') {
      setFilteredParticipants(participants);
    } else {
      const lower = searchQuery.toLowerCase();
      const filtered = participants.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.phone.includes(lower)
      );
      setFilteredParticipants(filtered);
    }
  }, [searchQuery, participants, isCreator, isExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || submitting) return;

    if (isFull && !editingId && !isCreator) {
        toast({
            variant: "destructive",
            title: "Limit Reached",
            description: "You have reached your limit of 3 contacts for this session."
        });
        return;
    }

    if (fullName.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid Name",
        description: "Please enter a valid full name."
      });
      return;
    }
    
    if (!countryCode.startsWith('+') || countryCode.length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid Country Code",
        description: "Country code must start with '+' (e.g., +1, +44)."
      });
      return;
    }

    if (phoneNumber.trim().length < 4) {
       toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number."
      });
      return;
    }

    setSubmitting(true);
    const finalPhone = countryCode + phoneNumber;

    try {
      if (editingId && isCreator) {
        // Edit Mode (Only Creator)
        // CRITICAL FIX: We must use .select() to verify the update actually happened in the DB
        // If RLS blocks it, data will be empty or error will be thrown
        const { data: updatedData, error } = await supabase
          .from('participants')
          .update({ name: fullName.trim(), phone: finalPhone })
          .eq('id', editingId)
          .select();

        if (error) throw error;
        
        // If no data returned, it means the row wasn't found or RLS blocked it
        if (!updatedData || updatedData.length === 0) {
           throw new Error("Update failed. You may not have permission to edit this contact.");
        }
        
        // Update local state for immediate feedback
        const updatedParticipants = participants.map(p => 
          p.id === editingId ? { ...p, name: fullName.trim(), phone: finalPhone } : p
        );
        setParticipants(updatedParticipants);
        setFilteredParticipants(updatedParticipants);
        
        setEditingId(null);
        toast({ title: "Success", description: "Contact updated successfully!" });
      } else {
        // Add Mode
        const { error: insertError } = await supabase
          .from('participants')
          .insert([{
            session_id: session.id,
            name: fullName.trim(),
            phone: finalPhone
          }]);

        if (insertError) {
          if (insertError.code === '23505') throw new Error("This contact is already added.");
          throw insertError;
        }

        await supabase.rpc('increment_participant_count', { session_id_param: session.id });

        if (!isCreator) {
            // Only track limits for non-creators
            const localSubmissions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            const newSubmissions = [...localSubmissions, { 
            name: fullName.trim(), 
            timestamp: new Date().toISOString() 
            }];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSubmissions));
            
            if (newSubmissions.length >= SUBMISSION_LIMIT) {
              setIsFull(true);
            }
             toast({ title: "Success", description: "Contact added! Redirecting to group..." });
             setTimeout(() => {
                if (!isExpired) window.location.href = session.whatsapp_link;
             }, 1500);
        } else {
             // If creator adds manually, refresh list
             const { data: parts } = await supabase.from('participants').select('*').eq('session_id', sessionId);
             setParticipants(parts || []);
             setFilteredParticipants(parts || []);
             toast({ title: "Success", description: "Contact added manually." });
        }
      }

      setFullName('');
      setPhoneNumber('');
      setCountryCode('');
      setSubmitting(false);

    } catch (error) {
      setSubmitting(false);
      console.error("Operation error:", error);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: error.message || "An unexpected error occurred."
      });
    }
  };

  const handleDelete = async (participantId) => {
     if (!isCreator) return;
     try {
       // CRITICAL FIX: Verify delete with select or count to ensure permissions allowed it
       const { error, count } = await supabase
         .from('participants')
         .delete({ count: 'exact' })
         .eq('id', participantId);
       
       if (error) throw error;
       
       const updatedList = participants.filter(p => p.id !== participantId);
       setParticipants(updatedList);
       setFilteredParticipants(updatedList);
       
       toast({ title: "Deleted", description: "Contact removed from list." });
     } catch (err) {
       toast({ variant: "destructive", title: "Error", description: "Could not delete contact. Permission denied." });
     }
  };

  const handleEdit = (participant) => {
    if (!isCreator) return;
    setEditingId(participant.id);
    setFullName(participant.name);
    
    const match = participant.phone.match(/^(\+\d+)(.*)$/);
    if (match) {
        setCountryCode(match[1]);
        setPhoneNumber(match[2]);
    } else {
        setCountryCode('');
        setPhoneNumber(participant.phone);
    }
  };

  const handleBulkImport = (e) => {
    if (!isCreator) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      let successCount = 0;
      
      // Simple format: Name, Phone (CSV)
      for (let line of lines) {
        const [name, phone] = line.split(',').map(s => s?.trim());
        if (name && phone) {
           if (name.length > 1 && phone.length > 5) {
               try {
                   await supabase.from('participants').insert([{
                       session_id: session.id,
                       name: name,
                       phone: phone 
                   }]);
                   successCount++;
               } catch(e) { console.error(e) }
           }
        }
      }

      if (successCount > 0) {
          toast({ title: "Import Complete", description: `Imported ${successCount} contacts.` });
          // Refresh list to update VCF data immediately
          const { data: parts } = await supabase.from('participants').select('*').eq('session_id', sessionId);
          setParticipants(parts || []);
          setFilteredParticipants(parts || []);
      } else {
          toast({ variant: "destructive", title: "Import Failed", description: "No valid contacts found. Format: Name, +1234567890" });
      }
    };
    reader.readAsText(file);
  };

  const generateVCF = async () => {
    setIsGenerating(true);
    try {
      // 1. Fetch the absolute latest data from DB to ensure we have recent edits/additions
      const { data: latestParticipants, error } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId);

      if (error) {
        console.error("VCF Fetch Error:", error);
        throw new Error("Failed to fetch contact list from server.");
      }

      if (!latestParticipants || latestParticipants.length === 0) {
        toast({
          variant: "destructive",
          title: "No Contacts",
          description: "No contacts found to download. Please wait for the list to refresh."
        });
        setIsGenerating(false);
        return;
      }

      // Update local state to match what we just fetched (keeps UI in sync)
      setParticipants(latestParticipants);
      setFilteredParticipants(latestParticipants);

      // 2. Generate VCF content from the FRESH data
      let vcfContent = '';
      latestParticipants.forEach(p => {
        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${p.name}\nTEL;TYPE=CELL:${p.phone}\nEND:VCARD\n`;
      });
      
      const blob = new Blob([vcfContent], { type: 'text/vcard' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Group_${session?.name?.replace(/[^a-z0-9]/gi, '_') || 'Contact'}_Contacts.vcf`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${latestParticipants.length} contacts.`,
      });

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not generate VCF file. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading session...</p>
      </div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6 border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Session Unavailable</h3>
        <p className="text-red-600 dark:text-red-300 mt-2">This session link may be invalid or has been removed.</p>
      </Card>
    </div>
  );

  // EXPIRED VIEW (DOWNLOAD PAGE)
  if (isExpired) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
        <div className="w-full max-w-4xl space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-950">
            <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-600 w-full" />
            <CardHeader className="text-center border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 pb-8">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 dark:border-green-900 shadow-sm">
                 <FileCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">Download VCF</CardTitle>
              <CardDescription className="text-base mt-2">
                 Session: <span className="font-semibold text-slate-700 dark:text-slate-300">{session.name}</span>
                 <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800">VCF Ready</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col pt-8 pb-8 px-6">
              
              {/* Creator-Only Admin Tools */}
              {isCreator ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-8">
                  <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-semibold">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Admin Controls</span>
                  </div>
                  
                  {/* Toolbar */}
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Search contacts..." 
                          className="pl-9 bg-white dark:bg-slate-950 dark:border-slate-800"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative">
                            <Input 
                              type="file" 
                              accept=".csv,.txt" 
                              onChange={handleBulkImport} 
                              className="hidden" 
                              id="bulk-import" 
                            />
                            <Button variant="outline" className="bg-white dark:bg-slate-950 dark:border-slate-800" onClick={() => document.getElementById('bulk-import').click()}>
                                <Upload className="w-4 h-4 mr-2" /> Import CSV
                            </Button>
                        </div>
                    </div>
                  </div>

                  {/* Contact List Preview (Admin Only) */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden mb-4 bg-white dark:bg-slate-950 max-h-[300px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium sticky top-0">
                          <tr>
                              <th className="px-4 py-3">Name</th>
                              <th className="px-4 py-3">Phone</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {filteredParticipants.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                                    No contacts found.
                                </td>
                              </tr>
                          ) : (
                              filteredParticipants.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{p.name}</td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">{p.phone}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                      <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                          <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                    </table>
                  </div>

                  {/* Editing Form Overlay/Inline (Admin Only) */}
                  {editingId && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-lg flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Edit Name</Label>
                            <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-white dark:bg-slate-900 h-9" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs">Edit Phone (Full)</Label>
                            <Input value={countryCode + phoneNumber} onChange={e => {
                                const val = e.target.value;
                                if (val.startsWith('+')) {
                                    setCountryCode(val.substring(0, 3)); 
                                    setPhoneNumber(val.substring(3));
                                } else {
                                    setPhoneNumber(val);
                                }
                            }} className="bg-white dark:bg-slate-900 h-9" />
                        </div>
                        <Button size="sm" onClick={handleSubmit} className="h-9">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setFullName(''); setPhoneNumber(''); setCountryCode(''); }} className="h-9"><X className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>
              ) : (
                // Regular User View when Expired/Ready
                <div className="text-center py-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mb-8 px-6">
                   <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">Session Completed</h3>
                   <p className="text-blue-600 dark:text-blue-400 text-sm">
                      The VCF file has been generated. You can now download it below and import all contacts.
                   </p>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  {/* Prioritize actual list length if available (for VCF correctness), fallback to session count if list is loading or empty due to delay */}
                  {participants.length > 0 ? participants.length : (session.participants_count || 0)}
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide text-xs">Contacts Compiled</p>
              </div>

              <div className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 mb-8 flex items-center justify-center gap-3">
                 <CheckCircle2 className="w-5 h-5 text-green-500" />
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ready for instant import</span>
              </div>

              <Button 
                size="lg"
                disabled={!canDownload || isGenerating || participants.length === 0}
                onClick={generateVCF}
                className="w-full h-14 text-lg font-semibold shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white transition-all duration-300 transform hover:scale-[1.02]"
              >
                 {!canDownload ? (
                   <>Preparing file in {countdown}s...</>
                 ) : isGenerating ? (
                   <>
                     <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Generating VCF...
                   </>
                 ) : (
                   <>
                     <DownloadIcon className="mr-2 h-6 w-6" /> Download Contact File
                   </>
                 )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg text-slate-900 dark:text-white">How to Import Contacts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="android" className="border-b-slate-200 dark:border-b-slate-800">
                  <AccordionTrigger className="hover:no-underline text-slate-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-500" />
                      <span>Android Instructions</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-400 space-y-2 pl-6">
                    <p>1. Tap the "Download Contact File" button above.</p>
                    <p>2. Once downloaded, tap "Open" in the notification bar.</p>
                    <p>3. Select "Contacts" or "Phone" app if prompted.</p>
                    <p>4. Choose the Google account you want to save contacts to.</p>
                    <p>5. The contacts will be automatically imported.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="ios" className="border-b-slate-200 dark:border-b-slate-800">
                  <AccordionTrigger className="hover:no-underline text-slate-900 dark:text-slate-200">
                     <div className="flex items-center gap-2">
                      <Apple className="w-4 h-4 text-slate-500" />
                      <span>iPhone (iOS) Instructions</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-400 space-y-2 pl-6">
                    <p>1. Tap the "Download Contact File" button above.</p>
                    <p>2. A prompt will appear showing the contact list.</p>
                    <p>3. Tap "Share" icon in the top right corner.</p>
                    <p>4. Scroll down and tap "Contacts" icon.</p>
                    <p>5. Tap "Save" to import all contacts to your address book.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ACTIVE VIEW (FORM)
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px]"
      >
        <Card className="w-full border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-950 ring-1 ring-slate-900/5 dark:ring-white/10">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 w-full" />
          
          <CardHeader className="text-center pb-6 pt-8 px-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100 dark:border-blue-900/50 relative overflow-hidden">
               <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 opacity-50"></div>
               <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400 relative z-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{session.name}</CardTitle>
            <CardDescription className="text-base font-medium text-slate-500 dark:text-slate-400 mt-2">
              Add your contact details to join the group
            </CardDescription>
            
            {/* Show LIVE count to encourage users */}
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
               <Users className="w-3 h-3 text-slate-500 mr-2" />
               <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                 {session.participants_count || 0} joined so far
               </span>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8 pt-2">
            {isFull && !editingId && !isCreator ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
                <div className="w-14 h-14 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
                   <Users className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Limit Reached</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                  You have added the maximum of <span className="font-semibold">3 contacts</span> from this device.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
                   <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                     Please wait for the administrator to generate and distribute the VCF file.
                   </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                   <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm ml-1">Full Name</Label>
                   <div className="relative group">
                     <User className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                     <Input 
                       required 
                       placeholder="e.g. Alex Richardson" 
                       className="pl-11 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 transition-all rounded-lg dark:text-white"
                       value={fullName}
                       onChange={(e) => setFullName(e.target.value)}
                     />
                   </div>
                </div>
                
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <Label className="text-slate-700 dark:text-slate-300 font-semibold text-sm ml-1">Phone Number</Label>
                   </div>
                   
                   <div className="flex gap-2">
                      <div className="flex-shrink-0 w-[5.5rem] relative group">
                        <Input
                          required
                          placeholder="+1"
                          className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 transition-all rounded-lg font-mono text-sm text-center dark:text-white"
                          value={countryCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[+]?[0-9]*$/.test(val)) {
                              setCountryCode(val);
                            }
                          }}
                        />
                      </div>
                      <div className="relative group flex-grow">
                        <Smartphone className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          required 
                          type="tel"
                          placeholder="5551234567" 
                          className="pl-11 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-blue-500 transition-all rounded-lg font-mono text-sm dark:text-white"
                          value={phoneNumber}
                          onChange={(e) => {
                             const val = e.target.value.replace(/[^0-9]/g, '');
                             setPhoneNumber(val);
                          }}
                        />
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-400 ml-1">
                      Start country code with <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">+</span> (e.g. +1, +44)
                   </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full h-12 text-base font-semibold mt-4 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-300 rounded-lg text-white"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Add Contact'
                  )}
                </Button>
                
                <div className="space-y-4 mt-6">
                  <p className="text-xs text-center text-slate-400">
                    By adding your contact, you agree to join this group list.
                  </p>
                  
                  <div className="pt-4 text-center border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-red-50 dark:bg-red-900/20 py-3 px-4 rounded-md border border-red-100 dark:border-red-900/50 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Mistake?</span>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                         Wrong number entered?{' '}
                         <a 
                            href="https://wa.me/+233557488116" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-red-600 dark:text-red-400 font-extrabold underline decoration-2 hover:text-red-700 dark:hover:text-red-300 ml-1"
                         >
                            Contact admin
                         </a>
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default JoinSession;


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Download as DownloadIcon, FileCheck, CheckCircle2, Smartphone, Apple, HelpCircle, Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const Download = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const [canDownload, setCanDownload] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData, error } = await supabase
        .from('vcf_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error || !sessionData) {
        setLoading(false);
        return;
      }

      // Initial fetch to show count
      const { data: parts } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId);

      setSession(sessionData);
      setParticipants(parts || []);
      
      // Check for expiration
      const createdAt = new Date(sessionData.created_at);
      const expiresAt = new Date(createdAt.getTime() + sessionData.duration_minutes * 60000);
      const now = new Date();
      
      if (now > expiresAt) {
        setIsExpired(true);
      }
      
      setLoading(false);
    };
    if (sessionId) fetchData();
  }, [sessionId]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanDownload(true);
    }
  }, [countdown]);

  const generateVCF = async () => {
    setIsGenerating(true);
    try {
      // 1. Fetch fresh data right before generating
      const { data: latestParticipants, error } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId);
        
      if (error) throw new Error("Failed to fetch contact list.");
      
      if (!latestParticipants || latestParticipants.length === 0) {
         toast({
           variant: "destructive",
           title: "No Contacts",
           description: "There are no contacts available to download."
         });
         setIsGenerating(false);
         return;
      }
      
      // Update state to match what we downloaded
      setParticipants(latestParticipants);

      // 2. Generate file from fresh data
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
        title: "Success",
        description: `Downloaded ${latestParticipants.length} contacts.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download Error",
        description: "Could not generate file. Please refresh and try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex justify-center bg-slate-50">
      <div className="mt-20 flex items-center gap-2 text-slate-500">
        <Loader2 className="animate-spin h-5 w-5 text-primary" />
        <span className="font-medium">Loading session data...</span>
      </div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen pt-24 flex justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50 text-center">
        <CardHeader>
          <CardTitle className="text-red-700">Session Not Found</CardTitle>
          <CardDescription className="text-red-600">This session link may be invalid.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-slate-200 shadow-md overflow-hidden">
          <div className="h-2 bg-green-500 w-full" />
          <CardHeader className="text-center border-b border-slate-50 bg-slate-50/50 pb-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100 shadow-sm">
               <FileCheck className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">Download VCF</CardTitle>
            <CardDescription className="text-base mt-2">
               Session: <span className="font-semibold text-slate-700">{session.name}</span>
               {isExpired && <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wide border border-orange-200">Expired - Public Access</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-8 pb-8">
            
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-slate-900 mb-2 tracking-tight">
                {participants.length}
              </div>
              <p className="text-slate-500 font-medium uppercase tracking-wide text-xs">Contacts Compiled</p>
            </div>

            <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-100 mb-8 flex items-center justify-center gap-3">
               <CheckCircle2 className="w-5 h-5 text-green-500" />
               <span className="text-sm font-medium text-slate-700">Ready for instant import</span>
            </div>

            <Button 
              size="lg"
              disabled={!canDownload || isGenerating}
              onClick={generateVCF}
              className="w-full h-14 text-lg font-semibold shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 transition-all duration-300 transform hover:scale-[1.02]"
            >
               {!canDownload ? (
                 <>Preparing file in {countdown}s...</>
               ) : isGenerating ? (
                 <>
                   <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Fetching latest data...
                 </>
               ) : (
                 <>
                   <DownloadIcon className="mr-2 h-6 w-6" /> Download Contact File
                 </>
               )}
            </Button>
            
            <p className="mt-6 text-xs text-slate-400 font-medium">
              Securely generated on {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">How to Import Contacts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="android">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span>Android Instructions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 space-y-2 pl-6">
                  <p>1. Tap the "Download Contact File" button above.</p>
                  <p>2. Once downloaded, tap "Open" in the notification bar.</p>
                  <p>3. Select "Contacts" or "Phone" app if prompted.</p>
                  <p>4. Choose the Google account you want to save contacts to.</p>
                  <p>5. The contacts will be automatically imported.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ios">
                <AccordionTrigger className="hover:no-underline">
                   <div className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-slate-500" />
                    <span>iPhone (iOS) Instructions</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 space-y-2 pl-6">
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
};

export default Download;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Link as LinkIcon, Loader2, Clock, Calendar } from 'lucide-react';

const CreateSession = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp_link: '',
    duration: 30 // default 30 mins
  });

  const timeOptions = [
    { label: '5 Minutes', value: 5, icon: Clock },
    { label: '24 Hours', value: 1440, icon: Clock },
    { label: '7 Days', value: 10080, icon: Calendar },
    { label: '14 Days', value: 20160, icon: Calendar },
    { label: '30 Days', value: 43200, icon: Calendar },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('vcf_sessions')
        .insert([{
          user_id: user.id,
          name: formData.name,
          whatsapp_link: formData.whatsapp_link,
          duration_minutes: formData.duration,
          participants_count: 0
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Session Created Successfully",
        description: "Your new contact session is now active and ready to share.",
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 bg-slate-50 flex justify-center pb-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Session</h1>
          <p className="text-slate-500 mt-2 text-lg">Set up a secure contact collection campaign.</p>
        </div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50">
            <CardTitle>Session Configuration</CardTitle>
            <CardDescription>Enter the details for your new VCF group collection.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label className="text-base">Group Name</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    required
                    placeholder="e.g. Project Alpha Team"
                    className="pl-10 h-11 text-base"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base">WhatsApp Group Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    required
                    type="url"
                    placeholder="e.g. https://chat.whatsapp.com/..."
                    className="pl-10 h-11 text-base"
                    value={formData.whatsapp_link}
                    onChange={(e) => setFormData({...formData, whatsapp_link: e.target.value})}
                  />
                </div>
                <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-md border border-blue-100 flex gap-2">
                  <span className="text-blue-500 font-bold">ℹ️</span>
                  Participants will be automatically redirected to this WhatsApp group after they submit their contact details.
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Session Duration</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {timeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({...formData, duration: option.value})}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 ${
                        formData.duration === option.value
                          ? 'bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 mb-1.5 ${formData.duration === option.value ? 'text-primary' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold whitespace-nowrap">{option.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">
                  After this duration, the session will expire and the download link will become public.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 text-lg font-semibold shadow-sm"
                >
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {loading ? 'Creating Session...' : 'Launch Session'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateSession;

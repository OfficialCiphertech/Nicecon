
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, Users, Link as LinkIcon, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vcf_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSessions();
  }, [user]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
             <p className="text-slate-500 mt-1">Manage your active sessions and downloads</p>
          </div>
          <Link to="/create-session">
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Create Session
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Sessions</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-slate-900">{sessions.length}</div>
             </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Links</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-blue-600">{sessions.length}</div>
             </CardContent>
          </Card>
           <Card className="border-slate-200 shadow-sm">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Participants</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-indigo-600">
                  {sessions.reduce((acc, curr) => acc + (curr.participants_count || 0), 0)}
               </div>
             </CardContent>
          </Card>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Sessions</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-slate-500">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-dashed border-slate-300">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No sessions yet</h3>
            <p className="text-slate-500 mb-4">Get started by creating your first contact collection session.</p>
            <Link to="/create-session">
               <Button variant="outline">Create Session</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 mb-1">{session.name}</CardTitle>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                        CIPHER{session.id.toString().padStart(4, '0')}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase mb-1">Duration</span>
                        <div className="flex items-center text-slate-700 font-medium">
                          <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                          {session.duration_minutes} mins
                        </div>
                      </div>
                      <div>
                         <span className="text-slate-500 block text-xs uppercase mb-1">Participants</span>
                         <div className="flex items-center text-slate-700 font-medium">
                           <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                           {session.participants_count || 0} / 3
                         </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/join/${session.id}`);
                        }}
                      >
                        <LinkIcon className="w-3 h-3 mr-2" /> Copy Link
                      </Button>
                      <Link to={`/download/${session.id}`} className="flex-1">
                         <Button size="sm" className="w-full bg-slate-900 hover:bg-slate-800">
                           <Download className="w-3 h-3 mr-2" /> Files
                         </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

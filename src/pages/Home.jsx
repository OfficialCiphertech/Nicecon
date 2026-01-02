
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Users, ArrowRight, ExternalLink, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Home = () => {
  return (
    <div className="min-h-screen pt-16 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Hero Section */}
      <section className="px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-8 shadow-sm">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                Professional VCF Management
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">
              Create and manage contact lists <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                with professional ease.
              </span>
            </h1>
            
            <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
              The standard for professional contact compilation. Securely gather contacts, manage sessions, and export VCF files effortlessly.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:text-white transition-all hover:scale-105">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                  <Mail className="mr-2 h-5 w-5" /> Contact Support
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Support Quick Access (Fixed) */}
      <section className="pb-24 pt-0 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Need help getting started?</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Our support team is available 24/7 to assist you.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                   <Link to="/contact" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full dark:border-slate-700 dark:text-slate-300">Contact Us</Button>
                   </Link>
                   <a href="https://t.me/Richvybs6" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
                      <Button variant="secondary" className="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-blue-100 dark:border-blue-800">
                         Telegram Support <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                   </a>
                </div>
             </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Secure Collection',
                desc: 'Encrypt and store contact information with enterprise-grade security protocols.',
                icon: Shield
              },
              {
                title: 'Instant Compilation',
                desc: 'Generate VCF files instantly as participants join your session.',
                icon: Zap
              },
              {
                title: 'Easy Distribution',
                desc: 'Seamlessly share compiled contact lists with your group via WhatsApp.',
                icon: Users
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center group hover:bg-slate-50 dark:hover:bg-slate-800 p-6 rounded-2xl transition-colors duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
             {[
               { label: 'Active Users', value: '10k+' },
               { label: 'Files Generated', value: '500k+' },
               { label: 'Uptime', value: '99.9%' },
             ].map((stat, i) => (
               <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center transform hover:-translate-y-1 transition-transform duration-300">
                 <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</div>
                 <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
               </div>
             ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

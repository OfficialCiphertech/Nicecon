
import React from 'react';
import { Send, MessageCircle, ExternalLink, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const Contact = () => {
  const socialLinks = [
    { name: 'Telegram Support', url: 'https://t.me/Richvybs6', icon: Send, color: 'text-blue-500' },
    { name: 'Telegram Channel', url: 'https://t.me/ciphertech2', icon: Send, color: 'text-blue-400' },
    { name: 'WhatsApp Group', url: 'https://chat.whatsapp.com/CxsbmV7zMpVCikL8o3h34K', icon: MessageCircle, color: 'text-green-500' },
    { name: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029Vb3wqli8V0tfOrWXwk2K', icon: MessageCircle, color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900">Contact Us</h1>
          <p className="text-slate-500 mt-2">We are here to help with any questions or support needs.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>Fill out the form below and we will get back to you shortly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input placeholder="Jane" />
                  </div>
                  <div className="space-y-2">
                    <Input placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Input type="email" placeholder="jane@example.com" />
                </div>
                <div className="space-y-2">
                  <Textarea 
                    className="min-h-[150px]"
                    placeholder="Hello, I need help with..."
                  />
                </div>
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Social Links */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full bg-slate-50 group-hover:bg-white border border-slate-100`}>
                      <link.icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    <span className="text-base font-semibold text-slate-900">{link.name}</span>
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                </a>
              ))}
            </div>
            
            <div className="p-8 rounded-xl bg-slate-900 text-white shadow-lg">
              <h3 className="text-xl font-bold mb-2">Professional Support</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Our support team is available 24/7 to assist with any technical issues regarding VCF generation or account management.
              </p>
              <div className="text-sm font-medium text-slate-400">
                Response time: &lt; 2 hours
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;

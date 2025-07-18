import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Book, Download, Play, Copy, ExternalLink } from "lucide-react";

const APIDocumentation = () => {
  const [activeTab, setActiveTab] = useState("endpoints");
  const [copiedCode, setCopiedCode] = useState("");

  const apiEndpoints = [
    {
      method: "POST",
      endpoint: "/functions/v1/create-payment-order",
      description: "Create new UPI payment order",
      params: ["amount", "name", "message", "streamerId"],
      response: "{ order_id, payment_url, status }"
    },
    {
      method: "POST",
      endpoint: "/functions/v1/verify-payment",
      description: "Verify payment status",
      params: ["order_id", "payment_id"],
      response: "{ status, amount, verified_at }"
    },
    {
      method: "POST",
      endpoint: "/functions/v1/donation-notification",
      description: "Send real-time donation alert",
      params: ["donation_id", "type", "content"],
      response: "{ notification_sent, alert_displayed }"
    },
    {
      method: "GET",
      endpoint: "/rest/v1/chiaa_gaming_donations",
      description: "Fetch donations with real-time subscription",
      params: ["select", "filter", "order"],
      response: "{ id, name, amount, message, status }"
    }
  ];

  const codeExamples = {
    javascript: `// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vsevsjvtrshgeiudrnth.supabase.co',
  'your-anon-key'
)

// Create payment order
const createPayment = async (donationData) => {
  const { data, error } = await supabase.functions.invoke('create-payment-order', {
    body: {
      amount: donationData.amount,
      name: donationData.name,
      message: donationData.message,
      streamerId: 'chiaa_gaming'
    }
  })
  
  if (error) throw error
  return data
}

// Real-time subscription
const subscribeToPayments = () => {
  return supabase
    .channel('donations')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chiaa_gaming_donations'
    }, (payload) => {
      console.log('New donation:', payload.new)
    })
    .subscribe()
}`,
    
    python: `import requests
from supabase import create_client, Client

# Initialize client
url = "https://vsevsjvtrshgeiudrnth.supabase.co"
key = "your-anon-key"
supabase: Client = create_client(url, key)

# Create payment
def create_payment(amount, name, message):
    response = supabase.functions.invoke('create-payment-order', {
        'body': {
            'amount': amount,
            'name': name,
            'message': message,
            'streamerId': 'chiaa_gaming'
        }
    })
    return response.data

# Fetch donations
def get_donations():
    response = supabase.table('chiaa_gaming_donations').select("*").execute()
    return response.data`,
    
    curl: `# Create payment order
curl -X POST 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/create-payment-order' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "amount": 100,
    "name": "Supporter",
    "message": "Great stream!",
    "streamerId": "chiaa_gaming"
  }'

# Verify payment
curl -X POST 'https://vsevsjvtrshgeiudrnth.supabase.co/functions/v1/verify-payment' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "order_id": "ORDER_ID",
    "payment_id": "PAYMENT_ID"
  }'`
  };

  const sdks = [
    { name: "JavaScript SDK", language: "JavaScript/TypeScript", size: "2.3MB", downloads: "500K+" },
    { name: "Python SDK", language: "Python", size: "1.8MB", downloads: "200K+" },
    { name: "React SDK", language: "React", size: "3.1MB", downloads: "150K+" },
    { name: "Node.js SDK", language: "Node.js", size: "2.1MB", downloads: "300K+" }
  ];

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <section id="api-documentation" className="py-16 px-4 bg-gradient-to-br from-background to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-hyperchat-blue/10 text-hyperchat-blue border-hyperchat-blue/20">
            <Code className="w-3 h-3 mr-1" />
            Developer Resources
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Complete API Documentation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive developer documentation with code examples, SDKs, 
            and integration guides for all platforms.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
            <TabsTrigger value="sdks">SDKs & Tools</TabsTrigger>
            <TabsTrigger value="testing">API Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="mt-6">
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <Card key={index} className="hover:scale-105 transition-transform">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Badge 
                        variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                        className={endpoint.method === 'GET' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{endpoint.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Parameters</h4>
                        <div className="space-y-1">
                          {endpoint.params.map((param, paramIndex) => (
                            <Badge key={paramIndex} variant="outline" className="mr-1 mb-1">
                              {param}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Response</h4>
                        <code className="text-xs bg-muted/50 p-2 rounded block">
                          {endpoint.response}
                        </code>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Play className="w-3 h-3 mr-1" />
                        Try It
                      </Button>
                      <Button size="sm" variant="outline">
                        <Book className="w-3 h-3 mr-1" />
                        Docs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examples" className="mt-6">
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>

              {Object.entries(codeExamples).map(([language, code]) => (
                <TabsContent key={language} value={language} className="mt-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg capitalize">{language} Example</CardTitle>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyCode(code)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiedCode === code ? 'Copied!' : 'Copy'}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                        <pre>{code}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="sdks" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {sdks.map((sdk, index) => (
                <Card key={index} className="hover:scale-105 transition-transform">
                  <CardHeader>
                    <CardTitle className="text-lg">{sdk.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span>Language:</span>
                        <span className="font-mono">{sdk.language}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="font-mono">{sdk.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads:</span>
                        <span className="font-mono">{sdk.downloads}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-hyperchat-blue hover:bg-hyperchat-blue/90">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Docs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Installation Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">NPM/Yarn</h4>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm">
                      npm install @supabase/supabase-js
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Python</h4>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm">
                      pip install supabase
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">CDN</h4>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm">
                      &lt;script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"&gt;&lt;/script&gt;
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-hyperchat-purple" />
                    API Testing Console
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Endpoint</label>
                    <select className="w-full mt-1 p-2 border rounded-lg bg-background">
                      <option>POST /create-payment-order</option>
                      <option>POST /verify-payment</option>
                      <option>GET /chiaa_gaming_donations</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Request Body</label>
                    <textarea 
                      className="w-full mt-1 p-2 border rounded-lg bg-background font-mono text-sm"
                      rows={6}
                      defaultValue={`{
  "amount": 100,
  "name": "Test User",
  "message": "Test donation",
  "streamerId": "chiaa_gaming"
}`}
                    />
                  </div>
                  
                  <Button className="w-full bg-hyperchat-purple hover:bg-hyperchat-purple/90">
                    <Play className="w-4 h-4 mr-2" />
                    Send Request
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-500 mb-2">Status: 200 OK</div>
                    <pre>{`{
  "order_id": "ord_123456789",
  "payment_url": "upi://pay?...",
  "status": "created",
  "amount": 100,
  "created_at": "2024-01-18T10:30:00Z"
}`}</pre>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Button size="sm" variant="outline" className="w-full">
                      <Download className="w-3 h-3 mr-1" />
                      Download Postman Collection
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View OpenAPI Spec
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <Card className="inline-block p-6">
            <CardContent className="p-0">
              <h3 className="text-xl font-bold mb-4">Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                Our developer support team is here to help you integrate successfully.
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline">
                  <Book className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Discord Community
                </Button>
                <Button className="bg-hyperchat-blue hover:bg-hyperchat-blue/90">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default APIDocumentation;
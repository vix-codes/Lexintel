
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { lawyers as mockLawyers, allStates, citiesByState, type LawyerProfile } from '@/lib/data';
import { MapPin, Search, Loader2, LocateFixed, Globe, Building } from 'lucide-react';
import Header from '@/components/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LawyerCard } from '@/components/lawyer-card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TabValue = 'all-india' | 'near-me' | 'select-location';

export default function FindLawyerPage() {
  const { toast } = useToast();
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('all-india');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [firestoreLawyers, setFirestoreLawyers] = useState<LawyerProfile[] | null>(null);
  const [isLoadingFirestore, setIsLoadingFirestore] = useState(false);

  useEffect(() => {
    async function loadLawyers() {
      setIsLoadingFirestore(true);
      try {
        const res = await fetch('/api/lawyers', { method: 'GET' });
        if (!res.ok) {
          setFirestoreLawyers([]);
          return;
        }
        const data = await res.json();
        setFirestoreLawyers(data.lawyers || []);
      } catch (error) {
        console.error('Failed to load lawyers:', error);
        setFirestoreLawyers([]);
      } finally {
        setIsLoadingFirestore(false);
      }
    }

    loadLawyers();
  }, []);

  // Combine mock data and firestore data, ensuring no duplicates
  const allLawyers = useMemo(() => {
    const combined = [...mockLawyers];
    const mockIds = new Set(mockLawyers.map(l => l.id));

    if (firestoreLawyers) {
      firestoreLawyers.forEach(fl => {
        if (!mockIds.has(fl.id)) {
          combined.push(fl);
        }
      });
    }
    return combined;
  }, [firestoreLawyers]);

  const handleUseLocation = () => {
    setIsLocating(true);
    setCurrentLocation(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const mockCity = "Bengaluru";
        setCurrentLocation(mockCity);
        toast({
          title: "Location Found",
          description: `Showing lawyers in ${mockCity}...`,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        
        let description = "Could not get your location. Please check your browser permissions.";
        if (error.code === error.PERMISSION_DENIED && error.message.includes("permissions policy")) {
            description = "Location access is blocked by your browser or the site's security policy. Please check site settings.";
        }

        toast({
          variant: "destructive",
          title: "Location Error",
          description: description,
        });
      }
    );
  };
  
  const resetFilters = () => {
    setCurrentLocation(null);
    setSelectedState('');
    setSelectedCity('');
  }

  const handleTabChange = (value: TabValue) => {
    resetFilters();
    setActiveTab(value);
  }

  const filteredLawyers = useMemo(() => {
    if (activeTab === 'all-india') {
      return allLawyers;
    }
    if (activeTab === 'near-me' && currentLocation) {
      return allLawyers.filter(lawyer => lawyer.location && lawyer.location.city === currentLocation);
    }
    if (activeTab === 'select-location' && selectedCity) {
      return allLawyers.filter(lawyer => lawyer.location && lawyer.location.city === selectedCity);
    }
    if (activeTab === 'select-location' && selectedState) {
      return allLawyers.filter(lawyer => lawyer.location && lawyer.location.state === selectedState);
    }
    return allLawyers;
  }, [activeTab, currentLocation, selectedState, selectedCity, allLawyers]);
  
  const renderContent = () => {
    if (isLoadingFirestore) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      );
    }

    if (filteredLawyers.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
        </div>
      );
    }

    if (activeTab === 'near-me' && isLocating) {
       return (
        <div className="flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg border-2 border-dashed">
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <h3 className="font-semibold">Finding your location...</h3>
            <p className="text-muted-foreground">Please wait a moment.</p>
        </div>
       );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 p-8 rounded-lg border-2 border-dashed">
        <Search className="h-10 w-10 text-muted-foreground" />
        <h3 className="font-semibold">No Verified Lawyers Found</h3>
        <p className="text-muted-foreground">There are no verified lawyers matching your current criteria.</p>
      </div>
    );
  };

  const getHeading = () => {
    if (activeTab === 'all-india') return "All Lawyers in India";
    if (activeTab === 'near-me' && currentLocation) return `Showing Results for ${currentLocation}`;
    if (activeTab === 'select-location' && selectedCity) return `Showing Results for ${selectedCity}, ${selectedState}`;
    if (activeTab === 'select-location' && selectedState) return `Showing Results for ${selectedState}`;
    return 'Results';
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Find a Verified Professional
            </CardTitle>
            <CardDescription>Search our network of verified lawyers by location.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as TabValue)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all-india">
                  <Globe className="mr-2 h-4 w-4" />
                  All India
                </TabsTrigger>
                <TabsTrigger value="near-me">
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Near Me
                </TabsTrigger>
                <TabsTrigger value="select-location">
                  <Building className="mr-2 h-4 w-4" />
                  Select Location
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all-india" className="mt-4">
                 <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg border">
                    <h3 className="font-semibold text-lg">All Lawyers</h3>
                    <p className="text-muted-foreground">Showing all verified lawyers from our network across India.</p>
                 </div>
              </TabsContent>
              
              <TabsContent value="near-me" className="mt-4">
                <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg border">
                  <h3 className="font-semibold text-lg">Find Lawyers Near You</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">Use your device's location to find verified legal professionals in your immediate area.</p>
                  <Button onClick={handleUseLocation} disabled={isLocating}>
                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Use My Current Location
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="select-location" className="mt-4">
                 <div className="p-8 rounded-lg border space-y-4">
                    <h3 className="font-semibold text-lg text-center">Filter by Location</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                        <Select onValueChange={(value) => { setSelectedState(value); setSelectedCity(''); }} value={selectedState}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a State..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allStates.map(state => (
                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a City..." />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedState && citiesByState[selectedState] ? (
                            citiesByState[selectedState].map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="-" disabled>Select a state first</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                 </div>
               </TabsContent>
            </Tabs>
            
            <div className="mt-8">
              <h2 className="font-headline text-xl mb-4">
                {getHeading()}
              </h2>
              {renderContent()}
            </div>
            
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

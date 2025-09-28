import { useState } from 'react';
import { FormDetail } from '@/components/FormDetail';
import { WeatherWidget } from '@/components/WeatherWidget';
import { DateTimeWidget } from '@/components/DateTimeWidget';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Bell,
  User,
  Settings,
  ChefHat,
  Utensils,
  Factory,
  Cake,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Filter,
  MoreVertical,
  Shield,
  ThumbsUp
} from 'lucide-react';
import bravoBrandLogo from '@/assets/bravo-brand-logo.jpg';

// Real form data based on user requirements
const formCategories = {
  foh: {
    name: "FOH Records",
    icon: Utensils,
    color: "from-blue-500 to-blue-600",
    forms: [
      { id: 1, title: "Daily Cleaning & Sanitizing - AM", status: "completed", priority: "high", dueTime: "6:00 AM", location: "Front Counter" },
      { id: 2, title: "Daily Cleaning & Sanitizing - PM", status: "pending", priority: "high", dueTime: "6:00 PM", location: "Front Counter" },
      { id: 3, title: "Weekly Cleaning - AM", status: "pending", priority: "medium", dueTime: "Monday 6:00 AM", location: "Dining Area" },
      { id: 4, title: "Monthly Temp Logs - Chillers", status: "overdue", priority: "critical", dueTime: "2 hours ago", location: "Display Area" },
      { id: 5, title: "Fruit Washing & Sanitizing", status: "pending", priority: "high", dueTime: "Every 4 hours", location: "Prep Station" },
      { id: 6, title: "Customer Survey Logs", status: "completed", priority: "low", dueTime: "Daily", location: "Reception" },
      { id: 7, title: "Product Release Log", status: "pending", priority: "medium", dueTime: "Before service", location: "Service Counter" }
    ]
  },
  production: {
    name: "Production Records",
    icon: Factory,
    color: "from-green-500 to-green-600",
    forms: [
      { id: 8, title: "Certificates of Analysis", status: "pending", priority: "critical", dueTime: "Daily", location: "Production Floor" },
      { id: 9, title: "5 Why Report/Non-conformance", status: "completed", priority: "high", dueTime: "As needed", location: "Production Floor" },
      { id: 10, title: "Product Release", status: "pending", priority: "critical", dueTime: "Before dispatch", location: "Quality Lab" },
      { id: 11, title: "Daily Handwashing - AM", status: "completed", priority: "high", dueTime: "6:00 AM", location: "Production Entry" },
      { id: 12, title: "Daily Handwashing - PM", status: "pending", priority: "high", dueTime: "6:00 PM", location: "Production Entry" },
      { id: 13, title: "Weekly Showering Logs", status: "pending", priority: "medium", dueTime: "Weekly", location: "Locker Room" },
      { id: 14, title: "Food Sample Collection", status: "overdue", priority: "critical", dueTime: "1 hour ago", location: "Production Line" }
    ]
  },
  kitchen: {
    name: "Kitchen Records",
    icon: ChefHat,
    color: "from-orange-500 to-orange-600",
    forms: [
      { id: 15, title: "Daily Cleaning & Sanitizing", status: "pending", priority: "high", dueTime: "After each shift", location: "Main Kitchen" },
      { id: 16, title: "Weekly Cleaning Log", status: "completed", priority: "medium", dueTime: "Monday", location: "Kitchen Area" },
      { id: 17, title: "Monthly Temp - Under Bar Chillers", status: "pending", priority: "high", dueTime: "Monthly", location: "Kitchen Bar" },
      { id: 18, title: "Cooking Temp Log", status: "pending", priority: "critical", dueTime: "Every cooking", location: "Cooking Station" },
      { id: 19, title: "Cooling Temp Log", status: "overdue", priority: "critical", dueTime: "30 min ago", location: "Cooling Area" },
      { id: 20, title: "Thawing Temp Log", status: "pending", priority: "high", dueTime: "During thawing", location: "Prep Area" },
      { id: 21, title: "Hot Holding Temp Log", status: "completed", priority: "critical", dueTime: "Every 2 hours", location: "Service Line" },
      { id: 22, title: "Vegetable & Fruit Washing", status: "pending", priority: "high", dueTime: "Before use", location: "Wash Station" },
      { id: 23, title: "Shelf Life Inspection", status: "pending", priority: "medium", dueTime: "Daily", location: "Storage Area" }
    ]
  },
  bakery: {
    name: "Bakery Records", 
    icon: Cake,
    color: "from-purple-500 to-purple-600",
    forms: [
      { id: 24, title: "Baking, Moulding & Proofing", status: "pending", priority: "high", dueTime: "Each batch", location: "Bakery Floor" },
      { id: 25, title: "Cooling Log", status: "completed", priority: "medium", dueTime: "After baking", location: "Cooling Racks" },
      { id: 26, title: "Temp Records - Under Bar Chillers", status: "pending", priority: "high", dueTime: "Every 4 hours", location: "Bakery Chillers" },
      { id: 27, title: "Baking Control Sheet", status: "overdue", priority: "critical", dueTime: "45 min ago", location: "Oven Station" },
      { id: 28, title: "Mixing Control Sheet", status: "pending", priority: "high", dueTime: "Each mix", location: "Mixing Station" },
      { id: 29, title: "Shelf Life Inspection", status: "completed", priority: "medium", dueTime: "Daily", location: "Display Case" },
      { id: 30, title: "Net Content Log", status: "pending", priority: "low", dueTime: "Per batch", location: "Packaging Area" }
    ]
  },
  boh: {
    name: "BOH Records",
    icon: Building2, 
    color: "from-red-500 to-red-600",
    forms: [
      { id: 31, title: "Weekly Storage Room Cleaning", status: "pending", priority: "medium", dueTime: "Monday", location: "Storage Room" },
      { id: 32, title: "Weekly Cleaning Materials Log", status: "completed", priority: "low", dueTime: "Weekly", location: "Chemical Storage" },
      { id: 33, title: "Weekly Scullery Area Cleaning", status: "pending", priority: "medium", dueTime: "Sunday", location: "Scullery" },
      { id: 34, title: "Weekly Welfare Facility Cleaning", status: "overdue", priority: "medium", dueTime: "2 days ago", location: "Staff Area" },
      { id: 35, title: "Weekly Cold Room Cleaning", status: "pending", priority: "high", dueTime: "Saturday", location: "Cold Storage" },
      { id: 36, title: "Pest Control Log", status: "completed", priority: "high", dueTime: "Monthly", location: "Entire Facility" },
      { id: 37, title: "Monthly Temp - Walking Freezer", status: "pending", priority: "critical", dueTime: "Daily", location: "Walk-in Freezer" },
      { id: 38, title: "Employee PPE Register", status: "completed", priority: "medium", dueTime: "Daily", location: "Entry Points" },
      { id: 39, title: "Personal Hygiene Checklist", status: "pending", priority: "high", dueTime: "Start of shift", location: "Locker Room" },
      { id: 40, title: "Health Status Checklist", status: "pending", priority: "critical", dueTime: "Daily", location: "HR Office" }
    ]
  }
};

const Index = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard');
  const [selectedForm, setSelectedForm] = useState<{title: string, type: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('foh');

  const openForm = (title: string, type: string) => {
    setSelectedForm({ title, type });
    setCurrentView('form');
  };

  const backToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedForm(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';  
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-muted/50 text-muted-foreground border-muted/20';
      default: return 'bg-muted/50 text-muted-foreground border-muted/20';
    }
  };

  const getAllForms = () => {
    return Object.values(formCategories).flatMap(category => 
      category.forms.map(form => ({...form, categoryName: category.name}))
    );
  };

  const getFilteredForms = (categoryKey?: string) => {
    const forms = categoryKey ? formCategories[categoryKey as keyof typeof formCategories]?.forms || [] : getAllForms();
    return forms.filter(form => 
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStats = () => {
    const allForms = getAllForms();
    return {
      total: allForms.length,
      completed: allForms.filter(f => f.status === 'completed').length,
      pending: allForms.filter(f => f.status === 'pending').length,
      overdue: allForms.filter(f => f.status === 'overdue').length
    };
  };

  if (currentView === 'form' && selectedForm) {
    return (
      <FormDetail
        formTitle={selectedForm.title}
        formType={selectedForm.type}
        onBack={backToDashboard}
      />
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-light to-accent text-white shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 bg-primary-dark rounded-2xl flex items-center justify-center shadow-lg">
                  <ThumbsUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold">Bravo!</h1>
                <p className="text-white/90 text-sm">Food Safety Inspections</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Date, Time & Weather Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
            <DateTimeWidget />
            <WeatherWidget />
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-white/80">Total Forms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-light">{stats.completed}</div>
              <div className="text-xs text-white/80">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-light">{stats.pending}</div>
              <div className="text-xs text-white/80">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive-light">{stats.overdue}</div>
              <div className="text-xs text-white/80">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-card border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1">
        <div className="border-b bg-card">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            {Object.entries(formCategories).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <TabsTrigger 
                  key={key} 
                  value={key} 
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{category.name.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Form Lists */}
        <div className="p-4">
          {Object.entries(formCategories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <div className="space-y-3">
                {getFilteredForms(key).map((form) => (
                  <Card 
                    key={form.id}
                    className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 hover:scale-[1.02]"
                    style={{ borderLeftColor: `hsl(var(--${form.status === 'completed' ? 'success' : form.status === 'overdue' ? 'destructive' : 'warning'}))` }}
                    onClick={() => openForm(form.title, category.name)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-card-foreground leading-tight mb-1">
                          {form.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{form.location}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="p-1 h-auto">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(form.status)} text-xs`}>
                          {form.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {form.status === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {form.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={`${getPriorityColor(form.priority)} text-xs border`}>
                          {form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Due: {form.dueTime}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Floating Action Button */}
      <Button 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90 text-white"
        onClick={() => console.log('Quick add form')}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Index;
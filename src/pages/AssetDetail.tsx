import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge, AssetStatus } from "@/components/StatusBadge";
import { PriorityBadge, Priority } from "@/components/PriorityBadge";
import { CategoryBadge, AssetCategory, getCategoryIcon } from "@/components/CategoryBadge";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Printer, 
  Plus,
  Clock,
  MessageSquare,
  FileText,
  ExternalLink,
  Landmark
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Mock data - in real app this would come from API
const mockAssetDetail = {
  id: '1',
  institution: 'Fidelity Investments',
  type: '401k',
  value: 425000,
  accountNumber: '****4521',
  category: 'retirement' as AssetCategory,
  status: 'contacted' as AssetStatus,
  priority: 'high' as Priority,
  lastContactDate: '2026-01-07',
  nextFollowUpDate: '2026-01-21',
  daysSinceContact: 14,
  institutionPhone: '1-800-343-3548',
  institutionEmail: 'estates@fidelity.com',
  institutionFax: '1-866-667-3549',
  contactPerson: 'Sarah Johnson',
  communications: [
    {
      id: 'c1',
      date: '2026-01-07',
      type: 'initial_contact',
      method: 'phone',
      direction: 'outbound',
      subject: 'Initial claim submission',
      content: 'Called to initiate estate claim. Spoke with Sarah Johnson. She confirmed receipt of death certificate via fax. Claim number assigned: FC-2026-12345. Next step: Wait for claim package in mail (7-10 business days).',
      contactPerson: 'Sarah Johnson',
    },
    {
      id: 'c2',
      date: '2026-01-03',
      type: 'document_submission',
      method: 'fax',
      direction: 'outbound',
      subject: 'Death certificate and letters testamentary',
      content: 'Faxed certified death certificate (2 pages) and letters testamentary (3 pages) to estates department. Confirmation received.',
      contactPerson: null,
    },
  ],
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

const methodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  phone: Phone,
  email: Mail,
  fax: Printer,
  mail: FileText,
  portal: ExternalLink,
};

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const asset = mockAssetDetail; // In real app, fetch by id
  const CategoryIcon = getCategoryIcon(asset.category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-foreground">ExpectedEstate</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="section-container py-8">
        {/* Asset Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card-elevated p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Icon and Title */}
            <div className="flex items-start gap-4 flex-1">
              <div className={cn(
                'p-4 rounded-xl shrink-0',
                asset.category === 'retirement' && 'bg-violet-500/10 text-violet-600',
                asset.category === 'financial' && 'bg-primary/10 text-primary',
                asset.category === 'insurance' && 'bg-success/10 text-success',
                asset.category === 'employer' && 'bg-warning/10 text-warning',
                asset.category === 'property' && 'bg-orange-500/10 text-orange-600',
              )}>
                <CategoryIcon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {asset.institution}
                </h1>
                <p className="text-muted-foreground capitalize mb-3">
                  {asset.type.replace(/_/g, ' ')} • Account {asset.accountNumber}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={asset.status} />
                  <PriorityBadge priority={asset.priority} />
                  <CategoryBadge category={asset.category} />
                </div>
              </div>
            </div>

            {/* Value */}
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(asset.value)}
              </p>
            </div>
          </div>

          {/* Follow-up Alert */}
          {asset.daysSinceContact >= 7 && (
            <div className={cn(
              'mt-6 p-4 rounded-xl flex items-center gap-3',
              asset.priority === 'urgent' && 'bg-destructive/5 border border-destructive/20',
              asset.priority === 'high' && 'bg-orange-500/5 border border-orange-500/20',
              asset.priority === 'medium' && 'bg-warning/5 border border-warning/20',
            )}>
              <Clock className={cn(
                'w-5 h-5',
                asset.priority === 'urgent' && 'text-destructive',
                asset.priority === 'high' && 'text-orange-600',
                asset.priority === 'medium' && 'text-warning',
              )} />
              <div className="flex-1">
                <p className={cn(
                  'font-medium',
                  asset.priority === 'urgent' && 'text-destructive',
                  asset.priority === 'high' && 'text-orange-600',
                  asset.priority === 'medium' && 'text-warning',
                )}>
                  {asset.daysSinceContact} days since last contact
                </p>
                <p className="text-sm text-muted-foreground">
                  {asset.priority === 'urgent' && 'Consider filing a complaint with regulator'}
                  {asset.priority === 'high' && 'Escalation recommended - request to speak with supervisor'}
                  {asset.priority === 'medium' && 'Time for a gentle follow-up call'}
                </p>
              </div>
              <Button size="sm" className="shrink-0">
                Log Follow-up
              </Button>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Communication Log */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card-elevated"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Communication Log</h2>
                </div>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log Communication
                </Button>
              </div>

              <div className="divide-y divide-border/50">
                {asset.communications.map((comm, index) => {
                  const MethodIcon = methodIcons[comm.method] || MessageSquare;
                  return (
                    <motion.div
                      key={comm.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                          <MethodIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-medium text-foreground">
                                {comm.subject}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(comm.date)} • {comm.method.charAt(0).toUpperCase() + comm.method.slice(1)}
                                {comm.contactPerson && ` • ${comm.contactPerson}`}
                              </p>
                            </div>
                            <span className={cn(
                              'status-badge shrink-0',
                              comm.direction === 'outbound' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                            )}>
                              {comm.direction === 'outbound' ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {comm.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card-elevated p-5"
            >
              <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
              <div className="space-y-3">
                <a 
                  href={`tel:${asset.institutionPhone}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{asset.institutionPhone}</span>
                </a>
                <a 
                  href={`mailto:${asset.institutionEmail}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{asset.institutionEmail}</span>
                </a>
                <div className="flex items-center gap-3 p-3 rounded-lg">
                  <Printer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{asset.institutionFax}</span>
                </div>
              </div>
              {asset.contactPerson && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium text-foreground">{asset.contactPerson}</p>
                </div>
              )}
            </motion.div>

            {/* Available Forms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card-elevated p-5"
            >
              <h3 className="font-semibold text-foreground mb-4">Available Forms</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  Claim Form (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" />
                  Beneficiary Designation
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
